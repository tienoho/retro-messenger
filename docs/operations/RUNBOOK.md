# Operations Runbook

## Message send latency tăng

1. Kiểm tra API P95/P99.
2. Kiểm tra PostgreSQL lock/connection pool.
3. Kiểm tra outbox lag và realtime publisher.
4. Kiểm tra Redis/backplane latency nếu scale-out.
5. Giảm traffic bằng feature flag/rate limit nếu cần.

## Reconnect storm

1. Xác định proxy/network outage.
2. Kiểm tra SignalR connection count và handshake failures.
3. Bật jitter/backoff phía client.
4. Bảo vệ sync endpoint bằng rate limit và pagination.

## Upload backlog

1. Kiểm tra object storage và worker queue.
2. Tạm giới hạn file size/type.
3. Scale media worker, không scale API vô điều kiện.
