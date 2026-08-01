---
name: web-frontend
description: Use for React web messenger features, IndexedDB, client outbox, TanStack Query, Zustand, message rendering, and accessibility.
---

# SKILL — Web Frontend

## Trigger

React Web, Fluent UI, IndexedDB, SignalR, composer, message timeline.

## Procedure

1. Xác định server/UI/persistent state.
2. Dùng API client generated.
3. Map DTO sang client model.
4. Viết query/mutation.
5. Ghi optimistic state vào IndexedDB.
6. Gắn realtime handler.
7. Xử lý reconnect + sync.
8. Viết accessibility.
9. Viết Vitest/Playwright.

## Guardrails

- Không refresh token trong LocalStorage.
- Không message history trong Zustand.
- Không render danh sách lớn bằng `.map()` không virtualize.
