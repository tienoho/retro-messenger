# Giới hạn đã biết

Trạng thái dưới đây phản ánh lần xác minh cục bộ ngày 2026-08-01.

## Đã xác minh

- Desktop typecheck, 19 unit/failure tests, production build và Electron smoke đều đạt.
- Electron smoke kiểm tra login tokenless, updater trước đăng nhập, offline enqueue, reload recovery và preload capability whitelist.
- SQLite schema version 2 có cache conversations/messages, dedup, unread, account isolation và ACK/outbox transaction.
- Backend contact lifecycle send/list/accept/reject/cancel/block/unblock và chặn tin nhắn direct đã đạt 3 integration tests với PostgreSQL/Redis thật.
- SignalR Desktop đã nối message, reconnect delta sync, typing, Buzz và presence; token chỉ ở main process.
- Attachment dùng presigned upload/download trong main process với URL validation, no-redirect, save dialog và giới hạn 25 MB.
- NSIS Windows x64, blockmap và `latest.yml` đã tạo được cục bộ. Icon “R!” là tài nguyên riêng và được sinh deterministic.
- Desktop E2E hai tài khoản với backend live đã đạt cho message, typing, Buzz, presence, upload, scan và download attachment.
- Bản self-signed nội bộ đã ký, cài, khởi động và gỡ thành công trên GitHub hosted Windows VM sạch.

## Chưa xác minh hoàn toàn

- Chứng thư self-signed nội bộ không được Windows máy người dùng tin cậy. Stable/beta công khai vẫn bị chặn nếu thiếu chứng thư Authenticode từ CA.
- Chưa chạy upgrade signed N → N+1 từ GitHub Releases.
- Attachment message dùng text envelope tương thích ngược, chưa có attachment message contract riêng trong domain.
- Renderer production bundle khoảng 556 KB và chưa code-split.
- Voice/video, rooms, macOS và Linux packaging ngoài phạm vi Yahoo-core Windows.
- Mobile đã có secure session và Expo SDK 57 nhưng chưa hoàn tất SQLite account isolation, durable outbox, SignalR foreground và push background. Audit production còn một finding moderate trong tool Xcode; finding low còn lại thuộc ESLint workspace.
- Permission admin chi tiết, Web timeline virtualization và operational telemetry vẫn cần milestone riêng.

## Hệ quả phát hành

Có thể tạo bản Windows thử nghiệm nội bộ. Chỉ coi là public stable sau khi cung cấp PFX hợp lệ và hoàn thành VM install + signed auto-update N → N+1.
