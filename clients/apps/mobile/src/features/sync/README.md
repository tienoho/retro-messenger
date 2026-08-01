# Src — Features — Sync

## Responsibility

Resume sync, gap repair and outbox replay.

## Rules

- Chỉ phụ thuộc layer/package được kiến trúc cho phép.
- Public contract phải typed và có test khi triển khai code.
- Không lưu secret hoặc bypass authorization.
