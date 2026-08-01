# Admin Architecture

- React + Ant Design, token chỉ giữ trong memory qua shared API client.
- Admin chỉ gọi `/api/admin/v1/*` sau login; backend policy là nguồn quyết định quyền.
- Policy hiện có: `admin.users.read`, `admin.users.suspend`, `admin.audit.read`; cả ba tạm map vào Identity role `admin`.
- Dashboard đọc overview thật, user list tối thiểu và audit log; không tải nội dung chat, token hoặc secret.
- Suspend/restore dùng endpoint chuyên biệt, modal confirmation và reason 10–500 ký tự.
- Backend cấm self-action và commit lockout/profile/audit trong cùng transaction.

Xem `docs/architecture/decisions/ADR-0002-admin-boundary-and-audit.md`.
