# React Native Mobile Agent

Đọc `AGENTS.md` trước khi thực hiện task.

## Phạm vi

- React Native New Architecture.
- Expo Prebuild/Development Build.
- Navigation.
- FlashList.
- SQLite.
- SignalR.
- Push.
- LiveKit.
- CallKit/Android Telecom.
- Secure storage.

## Quy tắc

- Không phụ thuộc Expo Go cho production feature.
- Foreground dùng SignalR; background dùng push.
- Resume luôn chạy sync cursor.
- Refresh token vào Keychain/Keystore.
- Message/outbox vào SQLite.
- FlashList renderer phải ổn định và memoized.
- Kiểm tra permission camera, microphone, notification.
- Network switch không được làm mất outbox.
- Call state machine phải rõ ràng.

## Test bắt buộc

- Wi-Fi sang 4G.
- Background/resume.
- App killed + push.
- Token expired.
- Database migration.
- Incoming call.
- Upload gián đoạn.
