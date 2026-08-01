# Workflow — Release

1. Freeze contract.
2. Chạy backend build/test.
3. Chạy client lint/typecheck/test/build.
4. Chạy migration dry run.
5. Chạy security smoke test.
6. Build container và scan.
7. Deploy migration job.
8. Deploy API/Worker.
9. Deploy web/admin.
10. Phát hành desktop/mobile theo channel.
11. Theo dõi error rate, message latency, queue lag và reconnect.
12. Có quyết định rollback rõ ràng.
