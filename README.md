# Retro Messenger

Retro Messenger là nền tảng chat đa nền tảng lấy cảm hứng từ trải nghiệm messenger cổ điển, nhưng dùng thương hiệu và tài nguyên riêng.

## Thành phần

- Backend: .NET 10, ASP.NET Core Minimal API, SignalR, PostgreSQL, EF Core/Dapper, Redis và transactional outbox.
- Web: React + Vite, đăng nhập/đăng ký, Bearer auth, IndexedDB cache/outbox và reconnect SignalR.
- Desktop: Electron 43 + React; đã có auth main-owned, `safeStorage`, SQLite outbox, IPC validation và production Electron E2E.
- Mobile: React Native + Expo Prebuild; hiện vẫn ở mức scaffold.
- Admin: React + Vite + Ant Design; có role-gated dashboard, user suspension và audit.
- Infrastructure: PostgreSQL, Redis, MinIO, LiveKit và Docker Compose.

## Trạng thái hiện tại

Các đường nền tảng đã chạy được gồm:

- Identity và profile dùng cùng GUID; register/login/session/refresh hoạt động với JWT Bearer và refresh-token rotation bền vững.
- API hội thoại/tin nhắn kiểm tra authentication và membership ở backend.
- Sequence, message và outbox commit trong cùng transaction PostgreSQL.
- Migration runner theo dõi SHA-256 trong `infrastructure.schema_history` và từ chối script đã áp dụng nhưng bị đổi nội dung.
- Web đã được kiểm thử trình duyệt cho đăng ký, đăng nhập, gửi offline, khôi phục sau reload, cách ly outbox theo tài khoản và SignalR reconnect.
- Attachment dùng private MinIO/S3-compatible storage: presigned PUT/GET, xác nhận metadata trước scan, authorization theo membership/uploader và trạng thái `uploading → pending → ready/quarantined/failed`.

Đây chưa phải sản phẩm production hoàn chỉnh. Desktop realtime/cache/packaging, Mobile offline-first, Web timeline virtualization, admin permission chi tiết và operational telemetry còn là các milestone tiếp theo. Xem `docs/KNOWN_LIMITATIONS.md`.

## Chạy full stack cục bộ

Yêu cầu: .NET 10 SDK, Node.js 22+, pnpm, Docker Desktop và Python 3.

```powershell
Copy-Item .env.example .env
docker compose up -d --build postgres redis minio api worker
```

Đặt `JWT_SIGNING_KEY` trong `.env` thành secret ngẫu nhiên tối thiểu 32 byte. Giá trị mặc định chỉ dành cho local development.

Với volume PostgreSQL mới, Docker áp dụng các script `001` đến `007` và seed lúc khởi tạo. Với volume đã tồn tại, chạy migration runner:

```powershell
$env:ConnectionStrings__postgres = "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me"
dotnet run --project src/RetroMessenger.Migrations
```

Chạy Web:

```powershell
Set-Location clients
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @retro/web dev --host 127.0.0.1
```

API mặc định ở `http://localhost:5080`, Web ở `http://localhost:5173`.

## Quality gate

```powershell
dotnet format RetroMessenger.slnx --no-restore --verify-no-changes
dotnet build RetroMessenger.slnx --no-restore
dotnet test tests/RetroMessenger.IntegrationTests/RetroMessenger.IntegrationTests.csproj --no-build
dotnet run --no-build --project tests/RetroMessenger.SmokeTests

Set-Location clients
pnpm typecheck
pnpm test
pnpm build
```

Đọc tiếp:

- `docs/development/LOCAL_DEVELOPMENT.md`
- `docs/deployment/DEPLOYMENT.md`
- `docs/protocols/REST_API.md`
- `docs/protocols/REALTIME_PROTOCOL.md`
- `docs/KNOWN_LIMITATIONS.md`
- `AGENTS.md`
