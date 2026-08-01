---
name: react-native-mobile
description: Use for React Native mobile, SQLite, foreground/background lifecycle, push, SignalR, LiveKit, native permissions, and calls.
---

<!-- GENERATED FROM agents/react-native-mobile.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `react-native-mobile`.

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
