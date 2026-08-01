# Workflow — Database Change

1. Xác định owner module.
2. Viết schema proposal.
3. Đánh giá rolling-deploy compatibility.
4. Tạo migration mới.
5. Đánh giá lock và table size.
6. Backfill theo batch nếu cần.
7. Thêm index.
8. Chạy integration test.
9. Viết rollback/restore.
10. Migration job chạy trước API rollout.

## Expand/Contract

- Expand schema.
- Deploy code tương thích.
- Backfill.
- Chuyển read/write.
- Contract schema ở release sau.
