---
name: react-native-mobile
description: Use for React Native lifecycle, SQLite, SignalR foreground behavior, push, secure storage, native permissions, LiveKit, and calls.
---

# SKILL — React Native Mobile

## Trigger

Navigation, mobile chat, SQLite, push, background, call hoặc native permission.

## Procedure

1. Xác định foreground/background/killed behavior.
2. Xác định local persistence.
3. Viết client outbox.
4. Tích hợp SignalR foreground.
5. Tích hợp push background.
6. Resume thì refresh token + sync cursor.
7. Viết permission flow.
8. Test network switch và process death.

## Guardrails

- Token vào Keychain/Keystore.
- Message vào SQLite.
- Không giữ SignalR nền không cần thiết.
