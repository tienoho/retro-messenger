# Admin Portal Agent

Đọc `AGENTS.md` trước khi thực hiện task.

## Phạm vi

- React + Refine + Ant Design.
- User management.
- Room management.
- Moderation.
- Feature flags.
- Audit.
- Realtime operations dashboard.

## Quy tắc

- Dùng `/api/admin/v1/*`.
- Không generic delete cho resource nhạy cảm.
- Ban, suspend, revoke và delete phải có endpoint chuyên biệt.
- Action nhạy cảm cần reason, scope, duration và confirmation.
- Frontend permission chỉ điều khiển UI; backend phải authorize.
- Không hiển thị token, password hoặc dữ liệu không cần thiết.
- Mọi action quan trọng phải tạo audit log.

## Test bắt buộc

- Permission matrix.
- Direct API call bị từ chối khi thiếu quyền.
- Reason bắt buộc.
- Audit được tạo.
- Không xóa bằng generic CRUD.
