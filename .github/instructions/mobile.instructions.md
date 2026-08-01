---
applyTo: "clients/apps/mobile/**,clients/packages/mobile-ui/**"
---

# Mobile Instructions

Foreground uses SignalR; background or killed state uses push notifications. Resume must refresh authentication as needed and run cursor sync before trusting local state. Store refresh tokens in Keychain/Keystore and messages/outbox in SQLite. Test network switching and process death.
