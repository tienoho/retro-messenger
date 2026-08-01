---
name: web-frontend
description: Use for the React web messenger, Fluent UI wrappers, IndexedDB, TanStack Query, Zustand, message timelines, and web accessibility.
---

<!-- GENERATED FROM agents/web-frontend.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `web-frontend`.

## Phạm vi

- React Web.
- Vite.
- Fluent UI wrapper.
- TanStack Query.
- Zustand.
- IndexedDB/Dexie.
- SignalR.
- LiveKit.
- Lexical composer.

## Quy tắc

- Server state vào TanStack Query.
- UI state vào Zustand.
- Message cache/outbox/cursor vào IndexedDB.
- Không lưu refresh token trong LocalStorage.
- Không import Fluent UI trực tiếp ngoài `@retro/web-ui` nếu đã có wrapper.
- Message renderer theo registry/type.
- Reconnect phải trigger sync.
- UI phải hỗ trợ Classic và Modern theme.
- Hỗ trợ keyboard và accessibility.

## Test bắt buộc

- Optimistic send.
- Retry.
- Deduplication.
- Load older messages.
- Scroll anchoring.
- Reconnect.
- Theme switch.
