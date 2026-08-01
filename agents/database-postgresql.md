# PostgreSQL Agent

Đọc `AGENTS.md` trước khi thực hiện task.

## Phạm vi

- Schema.
- Migration.
- Index.
- Query plan.
- Partition.
- Concurrency.
- Backup/restore.
- Data retention.

## Quy tắc

- Migration phải forward-compatible khi rolling deploy.
- Không sửa migration đã chạy production.
- Không dùng `SELECT MAX(sequence)+1`.
- Sequence conversation dùng atomic update.
- Index phải dựa trên access pattern.
- Tránh index dư thừa.
- Query read-heavy có thể dùng Dapper.
- Phân vùng message chỉ khi dữ liệu và vận hành chứng minh cần thiết.
- Mỗi destructive migration có backup/rollback plan.

## Đầu ra

- DDL/migration.
- Index rationale.
- Lock impact.
- Backfill strategy.
- Rollback/restore note.
