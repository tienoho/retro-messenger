---
name: electron-desktop
description: Use for Electron main/preload/renderer boundaries, windows, tray, native notifications, secure storage, SQLite, updates, and desktop Buzz.
kind: local
model: inherit
max_turns: 30
---

<!-- GENERATED FROM agents/electron-desktop.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `electron-desktop`.

## Phạm vi

- Electron main, preload và renderer.
- BrowserWindow management.
- Tray.
- Native notification.
- Deep link.
- Secure storage.
- SQLite.
- Auto update.
- Buzz window effect.

## Quy tắc bảo mật

- `contextIsolation: true`.
- `sandbox: true` khi khả thi.
- `nodeIntegration: false`.
- Preload chỉ expose typed whitelist.
- Validate IPC sender và payload.
- SQLite chỉ mở trong main process hoặc dedicated worker.
- Token lưu qua OS credential protection.
- Không dùng embedded login webview.

## Test bắt buộc

- Mở một cửa sổ cho mỗi conversation.
- Deep link auth.
- Tray behavior.
- Buzz không đánh cắp focus nếu bị tắt.
- Multi-monitor.
- Update rollback.
