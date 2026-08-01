# Kiến trúc Electron Desktop

- Main process sở hữu window, tray, notification, updater, SignalR, HTTP session, file dialog và một connection SQLite.
- Refresh token được mã hóa bằng `safeStorage`; access/refresh token không đi qua IPC. Renderer không có Node integration và không mở database.
- SQLite schema version 2 lưu session, outbox, conversations, messages, unread và attachment metadata theo account. Migration nâng cấp tại chỗ từ version 1.
- Outbox dùng `clientMessageId` làm idempotency key, atomic claim, crash recovery và exponential backoff. ACK ghi message cache và xóa outbox trong cùng transaction.
- SignalR chỉ đẩy message/presence/typing/Buzz. Sau kết nối hoặc reconnect, main gọi REST `afterSequence` để bù sự kiện; PostgreSQL vẫn là source of truth.
- Preload chỉ expose typed capability whitelist. Main validate payload và exact sender frame trước mọi thao tác đặc quyền.
- Upload/download chạy ở main qua presigned URL HTTPS hoặc loopback, cấm redirect và giới hạn 25 MB. Binary không đi qua SignalR.
- Close của main window chuyển xuống tray; menu **Thoát** mới kết thúc ứng dụng. Notification click focus đúng conversation.
- `electron-updater` chỉ hoạt động trong packaged build. Renderer lấy snapshot và nhận state event ngay cả trước đăng nhập để người dùng luôn có thể tải/cài bản sửa lỗi. Stable/beta release yêu cầu installer Authenticode hợp lệ trước khi publish metadata.

## Ranh giới tương thích

- Event realtime mới phải tolerant với client cũ; adapter call compatibility không dùng `any`.
- Attachment message hiện dùng text envelope gồm tên file và attachment ID. Client cũ vẫn đọc được tên tệp, Desktop mới render nút download.
- Voice/video, room window, macOS và Linux packaging không thuộc milestone Yahoo-core Windows.
