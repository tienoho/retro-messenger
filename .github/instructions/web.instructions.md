---
applyTo: "clients/apps/web/**,clients/packages/web-ui/**,clients/packages/chat-core/**"
---

# Web Instructions

Use generated API clients. Put server state in TanStack Query, UI state in Zustand, and durable message cache/outbox/cursor in IndexedDB. Do not store refresh tokens in LocalStorage. Reconnect must trigger cursor sync. Use virtualized message lists and accessible components.
