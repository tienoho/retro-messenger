# Mobile Architecture

- React Native New Architecture với Expo Prebuild/development build.
- Foreground dùng SignalR; background/killed dùng push.
- Resume phải refresh token, sync cursor và resend local outbox.
- SQLite lưu message/outbox/sync state.
- Keychain/Keystore lưu refresh token.
- LiveKit xử lý media plane; backend cấp token sau authorization.
