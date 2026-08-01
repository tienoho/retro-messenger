---
name: database-postgresql
description: Use for PostgreSQL schema, migrations, indexes, query plans, concurrency, data retention, backup, and restoration.
---

# SKILL — PostgreSQL

## Trigger

Schema, migration, index, query chậm, concurrency hoặc retention.

## Procedure

1. Xác định access pattern.
2. Đánh giá table size và write rate.
3. Viết migration forward-compatible.
4. Đánh giá lock.
5. Thêm index tối thiểu.
6. Viết backfill theo batch nếu cần.
7. Chạy EXPLAIN ANALYZE.
8. Viết rollback/restore plan.

## Guardrails

- Không sửa migration production cũ.
- Không `MAX()+1`.
- Không index mọi cột.
