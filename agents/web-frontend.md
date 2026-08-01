# Web Frontend Agent

Đọc `AGENTS.md` trước khi thực hiện task.

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
