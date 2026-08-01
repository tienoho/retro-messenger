# Src — Features — Send-Message

## Responsibility

SQLite outbox and REST durable send.

## Rules

- Chỉ phụ thuộc layer/package được kiến trúc cho phép.
- Public contract phải typed và có test khi triển khai code.
- Không lưu secret hoặc bypass authorization.
