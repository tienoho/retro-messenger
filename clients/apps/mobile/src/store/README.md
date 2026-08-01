# Src — Store

## Responsibility

Small UI state only; message history remains in SQLite.

## Rules

- Chỉ phụ thuộc layer/package được kiến trúc cho phép.
- Public contract phải typed và có test khi triển khai code.
- Không lưu secret hoặc bypass authorization.
