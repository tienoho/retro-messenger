# Deployment

## Cấu hình bắt buộc

- `ConnectionStrings__postgres`: PostgreSQL production.
- `ConnectionStrings__redis`: Redis có authentication/TLS phù hợp môi trường.
- `Authentication__Jwt__SigningKey`: secret ngẫu nhiên tối thiểu 32 byte; không dùng fallback trong `docker-compose.yml`.
- `Authentication__Jwt__Issuer`, `Authentication__Jwt__Audience`: giá trị cố định theo environment; đổi giá trị sẽ vô hiệu token đang lưu ở client.
- `Authentication__RateLimit__*`: permit/window cho login, register và token endpoints. Redis phải sẵn sàng ở production để phối hợp nhiều API instance; local limiter chỉ là fallback.
- Secret MinIO/R2 và LiveKit theo môi trường triển khai.
- `Storage__Endpoint`: endpoint nội bộ API/Worker dùng để HEAD/GET/PUT object.
- `Storage__PublicEndpoint`: origin tuyệt đối browser truy cập; scheme phải đúng vì nó được đưa vào chữ ký.
- `Storage__AccessKey`, `Storage__SecretKey`, `Storage__BucketName`, `Storage__Region`, `Storage__UsePathStyle` và `Storage__AutoCreateBucket`.
- `ClamAv__Host`, `ClamAv__Port`, `ClamAv__ChunkSizeBytes`, `ClamAv__TimeoutSeconds`: daemon chỉ truy cập qua private service network; TCP clamd không có authentication hoặc encryption.
- `FFmpeg__ExecutablePath`, `FFmpeg__MaxDimensionPixels`, `FFmpeg__TimeoutSeconds`: executable và giới hạn thumbnail trong Worker.
- `MediaProcessing__BatchSize`, `MediaProcessing__LeaseSeconds`, `MediaProcessing__MaxAttempts`, `MediaProcessing__InitialRetryDelaySeconds`, `MediaProcessing__MaxRetryDelaySeconds`: claim, fencing và bounded exponential retry.
- `MediaCleanup__BatchSize`, `MediaCleanup__LeaseSeconds`, `MediaCleanup__UploadTimeoutHours`, `MediaCleanup__TerminalRetentionDays`, `MediaCleanup__FailureRetrySeconds`: retention và cleanup claim. Lease processing phải dài hơn tổng timeout scan/thumbnail; retention phải khớp policy pháp lý và forensic của môi trường.

Không log access token, refresh token, password, OTP hoặc nội dung chat riêng tư.

Rate-limit partition dùng `RemoteIpAddress`, không đọc trực tiếp `X-Forwarded-For`. Khi chạy sau reverse proxy, chỉ bật forwarded headers với danh sách proxy/network tin cậy; cấu hình tin mọi proxy cho phép attacker giả IP và né giới hạn.

## Object storage và CORS

Bucket phải private. API chỉ cấp presigned URL 15 phút sau khi kiểm tra membership; Worker dùng endpoint nội bộ và cùng bucket/credentials. Với MinIO Compose, đặt `MINIO_API_CORS_ALLOW_ORIGIN=${WEB_ORIGIN}` trên service MinIO. MinIO không triển khai S3 Bucket CORS API, nên ứng dụng không tự mutate CORS lúc runtime.

Với AWS S3 hoặc Cloudflare R2, provisioning CORS ở Terraform/dashboard/provider CLI, cho phép origin Web tin cậy dùng `PUT`, `GET`, `HEAD`; không dùng wildcard origin với credentialed browser flow. Rollback ứng dụng không xóa bucket/object. Trước rollout, kiểm tra presigned URL public có đúng scheme/host, CORS preflight và quyền bucket tối thiểu.

## Quét virus và thumbnail

Worker stream file tới `clamd` bằng lệnh `INSTREAM`; không mount bucket vào container antivirus và không publish cổng 3310 ra Internet. Official ClamAV image duy trì signature database trong volume `clamav_data`. Theo tài liệu ClamAV, daemon cần tối thiểu khoảng 3 GiB RAM và ưu tiên 4 GiB; lúc reload signature có thể dùng nhiều hơn, nên capacity/health alert phải phản ánh chi phí này.

Worker image cài FFmpeg và tạo thumbnail PNG giới hạn 320 px. Vì object stream từ S3/MinIO không seek được, Worker dùng một GET mới sau khi scan sạch thay vì tái sử dụng stream đã ở EOF. Thumbnail failure hiện được log và attachment vẫn `ready`; trước production cần retry/metric riêng nếu thumbnail là bắt buộc với UX.

## Migration

Migration runner:

```powershell
$env:ConnectionStrings__postgres = "<production connection string>"
dotnet run --project src/RetroMessenger.Migrations --configuration Release
```

Runner áp dụng lần lượt các file trong `deploy/postgres/migrations` và `deploy/postgres/seed`, rồi ghi SHA-256 vào `infrastructure.schema_history`. Script đã áp dụng được bỏ qua; cùng tên nhưng checksum khác sẽ làm deployment thất bại.

Các mount `/docker-entrypoint-initdb.d` trong Compose chỉ dùng khi tạo volume mới. Chúng không nâng cấp database đã tồn tại; mọi environment lâu dài phải chạy migration runner.

Migration hiện có:

- `001_initial.sql`: users, chat, messages và transactional outbox.
- `002_media_attachments.sql`: metadata attachment.
- `003_identity_and_feature_schema.sql`: ASP.NET Identity, OpenIddict, contacts, rooms và các cột profile bổ sung.
- `004_refresh_sessions.sql`: refresh-token family, rotation, reuse detection và revocation state.
- `005_contact_ownership.sql`: contact request có sender/recipient rõ ràng và relationship đối xứng.
- `006_admin_audit.sql`: admin audit log, index và Identity role `admin`.
- `007_media_processing_leases.sql`: additive claim/lease, retry/backoff và cleanup state cho media Worker.

`003`–`007` là thay đổi mở rộng (additive) và dùng `IF NOT EXISTS`; application cũ không được phụ thuộc vào việc xóa schema trong cùng release. Khi rollout `004`, refresh token stateless đã cấp trước đó không có session row và sẽ yêu cầu user đăng nhập lại. `005` giữ lại bảng prototype `contacts.contacts` nhưng application chuyển sang hai bảng mới; dữ liệu prototype không bị xóa hoặc tự suy diễn thành quan hệ thật. `007` để `next_processing_at` nullable cho hàng cũ và dùng `COALESCE(..., created_at)`, tránh backfill/row rewrite trong migration. Không chỉnh sửa file đã có trong `schema_history`; tạo migration mới để sửa tiến.

Rollout `007`: chạy migration trước, sau đó thay toàn bộ Media Worker trong cùng đợt. Worker cũ vẫn bỏ qua các cột additive nhưng không tham gia protocol claim/lease, vì vậy không chạy lâu dài mixed-version nhiều instance. Rollback code giữ nguyên schema `007`; không drop cột/index trong sự cố. Forward-fix là chiến lược mặc định, vì drop state trong lúc Worker mới đang chạy có thể làm mất fencing/retry state.

Sau khi user quản trị đã đăng ký, cấp role bằng quy trình vận hành có kiểm soát:

```sql
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
SELECT u."Id", r."Id"
FROM "AspNetUsers" u
JOIN "AspNetRoles" r ON r."NormalizedName" = 'ADMIN'
WHERE u."NormalizedUserName" = 'ADMIN_USERNAME'
ON CONFLICT DO NOTHING;
```

Không tự cấp role qua public API. User phải đăng nhập lại để access token nhận role mới.

## Thứ tự phát hành

1. Backup và xác minh restore point.
2. Chạy migration runner một lần, kiểm tra exit code và `schema_history`.
3. Deploy API canary với signing key/connection strings production.
4. Deploy Worker.
5. Deploy Web/Admin.
6. Phát hành Desktop/Mobile theo channel.
7. Theo dõi error rate, message latency, outbox lag và reconnect rate.

## Rollback và compatibility

- Rollback application chỉ an toàn khi schema mới vẫn backward-compatible.
- Dùng expand/migrate/contract cho thay đổi breaking; không drop/rename trong cùng release với code mới.
- Nếu migration additive lỗi sau khi commit, ưu tiên migration sửa tiến. Chỉ restore backup khi đã đánh giá mất dữ liệu và dừng writers.
- Realtime contract change phải giữ client cũ hoặc được version hóa trước khi rollout.
