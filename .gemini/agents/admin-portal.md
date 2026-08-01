---
name: admin-portal
description: Use for the Refine and Ant Design admin portal, moderation, permissions, audit, feature flags, and operations dashboards.
kind: local
model: inherit
max_turns: 30
---

<!-- GENERATED FROM agents/admin-portal.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `admin-portal`.

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
