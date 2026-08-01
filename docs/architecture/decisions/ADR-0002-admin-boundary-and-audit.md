# ADR-0002: Admin boundary, policy và audit

## Trạng thái

Accepted — 2026-07-29.

## Context

Admin client trước đây gọi API user thông thường, không có backend role/policy và hiển thị số liệu hard-code. Mutation quản trị cần authorization không phụ thuộc frontend, lý do bắt buộc và audit commit cùng thay đổi trạng thái.

Quality attributes ưu tiên: security, consistency và privacy; sau đó mới đến latency/dashboard richness. Retro Messenger vẫn là modular monolith nên không thêm deployment topology mới.

## Decision

- Dành namespace REST `/api/admin/v1/*` cho Admin.
- Dùng ba policy chuyên biệt `admin.users.read`, `admin.users.suspend`, `admin.audit.read`.
- Trong giai đoạn hiện tại, cả ba policy map vào ASP.NET Identity role `admin`; policy name giữ chỗ cho permission chi tiết sau này.
- JWT access token lấy role từ database tại lúc login/refresh.
- Action suspend/restore dùng endpoint riêng, cấm self-action, yêu cầu reason 10–500 ký tự và ghi `admin.audit_logs` trong cùng PostgreSQL transaction.
- Response user chỉ chứa profile/lockout tối thiểu; không trả email, password hash, token hoặc nội dung chat.

## Alternatives

### Chỉ kiểm tra quyền ở Admin UI

Loại bỏ vì client không phải security boundary và API vẫn bị gọi trực tiếp.

### Tách Admin thành microservice riêng

Loại bỏ ở giai đoạn này vì tạo thêm deployment, database ownership và distributed-consistency cost nhưng chưa có yêu cầu scale độc lập. Điều này cũng trái guardrail không thêm microservice khi chưa cần.

### Một endpoint CRUD generic cho user

Loại bỏ vì khó giới hạn field/action, dễ tạo generic delete và không bắt buộc reason/audit theo từng mutation.

## Consequences

- Backend là nguồn quyết định quyền; Admin UI chỉ cải thiện UX.
- Audit và suspension nhất quán theo transaction.
- Role `admin` còn thô; permission matrix chi tiết có thể thay mapping policy mà không đổi endpoint.
- Access token đã cấp giữ role đến expiry; thay đổi role không có hiệu lực tức thời với token cũ.
- Ant Design bundle hiện lớn và cần code splitting ở milestone performance.

## Migration và rollback

- Migration `006_admin_audit.sql` chỉ thêm schema/table/index và role `admin`; không xóa dữ liệu.
- Rollback application có thể bỏ dùng endpoint mới nhưng giữ audit table.
- Không drop audit log khi rollback; retention/purge phải có policy riêng.

## Validation

- Anonymous nhận 401, user thường nhận 403, admin nhận 200.
- Self-action và reason sai nhận 400.
- Suspend làm login target bị từ chối; restore cho phép login lại.
- Mỗi mutation tạo đúng một audit row.
- Browser smoke xác minh login, dashboard, confirmation, action và audit UI.
