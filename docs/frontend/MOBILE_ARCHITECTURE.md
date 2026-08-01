# Mobile Architecture

- React Native New Architecture với Expo Prebuild/development build.
- Foreground dùng SignalR; background/killed dùng push.
- Resume phải refresh token, sync cursor và resend local outbox.
- SQLite lưu message/outbox/sync state.
- Keychain/Keystore lưu refresh token.
- LiveKit xử lý media plane; backend cấp token sau authorization.

## Trạng thái triển khai

- Expo SDK 57 và React Native 0.86 đã qua Expo Doctor và Metro export Android/iOS/Web.
- Login, restore, refresh khi foreground và logout đi qua `MobileSessionController`; access token chỉ ở memory, refresh token dùng `expo-secure-store` với device-only accessibility.
- Refresh token bị từ chối sẽ bị xóa; lỗi mạng tạm thời giữ token để retry sau.
- SQLite account isolation, durable outbox, SignalR foreground và push background vẫn là các bước tiếp theo.
