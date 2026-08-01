# Database Schema

SQL migration nằm trong `deploy/postgres/migrations`:

- `001_initial.sql`: `users`, `chat`, message và outbox nền tảng.
- `002_media_attachments.sql`: attachment metadata.
- `003_identity_and_feature_schema.sql`: profile bổ sung, contacts, rooms, ASP.NET Identity và OpenIddict.
- `004_refresh_sessions.sql`: server-side refresh session và token-family state.
- `005_contact_ownership.sql`: contact request và relationship có ownership rõ ràng.
- `006_admin_audit.sql`: append-only admin audit và role bootstrap.
- `007_media_processing_leases.sql`: claim/lease, retry schedule và retention cleanup state cho attachment.

## Schemas

- `users`: profile và account-facing data.
- `chat`: conversation, member, message và transactional outbox.
- `contacts`: `contact_requests` và `contact_relationships`; bảng `contacts` cũ chỉ được giữ để tương thích dữ liệu prototype.
- `rooms`: public room metadata.
- `media`: attachment metadata.
- `infrastructure`: `schema_history` do migration runner quản lý.
- `auth`: refresh session; lookup bằng token hash, revoke theo family và cleanup theo expiry.
- `admin`: audit log cho mutation quản trị nhạy cảm.
- Các bảng ASP.NET Identity/OpenIddict hiện nằm trong schema `public` để khớp EF model.

## Message invariants

- `UNIQUE(sender_id, client_message_id)` chống gửi trùng.
- `UNIQUE(conversation_id, sequence_no)` bảo đảm thứ tự duy nhất.
- Sequence dùng atomic `UPDATE ... RETURNING` trong cùng transaction với insert message.
- Outbox record commit cùng transaction trước khi publish SignalR/push/search event.
- Redis không phải source of truth.

## Media processing invariants

- Worker claim batch bằng `FOR UPDATE SKIP LOCKED`; `processing_owner` là fencing token cho mọi finalize.
- Lease hết hạn được Worker khác reclaim; `processing_attempts` tăng trong cùng atomic claim.
- Failure trước ngưỡng trở lại `pending` với exponential backoff; đạt ngưỡng chuyển `failed`.
- Cleanup chỉ chọn `uploading` quá hạn hoặc `failed`/`quarantined` hết retention; attachment `ready` không bị xóa.
- `storage_deleted_at` ghi nhận object và thumbnail đã được xóa, nhưng metadata attachment được giữ.

## Áp dụng và kiểm chứng migration

```powershell
$env:ConnectionStrings__postgres = "Host=localhost;Port=5432;Database=retro_messenger;Username=retro;Password=change-me"
dotnet run --project src/RetroMessenger.Migrations
```

Runner sắp xếp script theo tên, tính SHA-256 và ghi vào `infrastructure.schema_history`. Chạy lại cùng script là idempotent; checksum thay đổi là lỗi. `ProductionMigrationTests` chạy toàn bộ SQL hai lần trên database riêng và so bảng/cột với EF model.

Không sửa `001`/`002`/`003`/`004`/`005`/`006`/`007` sau khi đã phát hành. Mọi thay đổi tiếp theo phải là migration mới kèm đánh giá backward compatibility và rollback/forward-fix.
