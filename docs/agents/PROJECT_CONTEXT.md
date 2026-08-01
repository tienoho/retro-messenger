# Project Context

## Sản phẩm

Retro Messenger là nền tảng chat đa nền tảng, tái hiện các trải nghiệm nổi bật của Yahoo Messenger theo thương hiệu riêng:

- Danh bạ theo nhóm.
- Presence.
- Invisible.
- Custom status.
- Chat cá nhân và nhóm.
- Public room.
- Buzz.
- Emoticon, sticker và Audible.
- File transfer.
- Voice/video call.
- Web, desktop và mobile.
- Admin và moderation.

## Nguyên tắc dữ liệu

- PostgreSQL: source of truth.
- Redis: trạng thái ngắn hạn và cache.
- SQLite/IndexedDB: local cache và client outbox.
- MinIO/R2: media.
- LiveKit: media plane.
- SignalR: realtime control/data event.
- REST: durable commands và query.

## Yêu cầu phi chức năng

- Không mất message đã ACK.
- Retry không tạo message trùng.
- Đồng bộ đa thiết bị.
- Offline-first cho message send.
- Privacy và moderation.
- Audit admin.
- Quan sát được lỗi và latency.
