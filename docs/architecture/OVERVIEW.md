# Architecture Overview

## Runtime topology

```text
Web / Electron / Mobile / Admin
        │ REST + SignalR + WebRTC
        ▼
ASP.NET Core API
        ├── Domain/Application
        ├── SignalR
        ├── PostgreSQL adapter
        ├── Redis adapter
        └── Outbox publisher
             │
             ├── Worker
             ├── Push
             ├── Search
             └── Media processing

LiveKit handles audio/video media.
MinIO/R2 stores attachments.
```

Starter hiện dùng repository in-memory để API có thể chạy trước khi PostgreSQL adapter được triển khai.

## Production transition

1. Giữ nguyên application interfaces.
2. Thêm EF Core/Npgsql implementation trong Infrastructure.
3. Thêm transactional outbox.
4. Đổi DI từ in-memory sang PostgreSQL theo configuration.
5. Giữ API contract và client không đổi.
