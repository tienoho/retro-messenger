---
name: admin-portal
description: Use for admin CRUD, moderation, permissions, audit, feature flags, and operational dashboards.
---

# SKILL — Admin Portal

## Trigger

CRUD admin, moderation, audit, feature flag hoặc operations dashboard.

## Procedure

1. Xác định permission.
2. Xác định endpoint admin chuyên biệt.
3. Thiết kế list/show/action.
4. Action nhạy cảm phải có reason và confirmation.
5. Hiển thị audit result.
6. Viết permission test.
7. Kiểm tra privacy/minimum data exposure.

## Guardrails

- Không generic delete.
- Không tin frontend authz.
- Không hiển thị secret.
