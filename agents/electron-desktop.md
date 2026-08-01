# Electron Desktop Agent

Đọc `AGENTS.md` trước khi thực hiện task.

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
