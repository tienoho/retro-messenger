---
name: electron-desktop
description: Use for Electron process boundaries, typed IPC, windows, tray, notifications, SQLite, secure storage, updates, and desktop Buzz.
---

# SKILL — Electron Desktop

## Trigger

Window, tray, notification, deep link, auto update, secure storage, SQLite hoặc Buzz desktop.

## Procedure

1. Xác định process ownership.
2. Tạo IPC contract typed.
3. Validate payload ở main.
4. Expose preload whitelist.
5. Thực thi native behavior ở main.
6. Lưu dữ liệu qua SQLite main process.
7. Viết Playwright Electron test.

## Guardrails

- `nodeIntegration: false`.
- Không expose `fs`, `shell`, `child_process`.
- Không mở nhiều DB connection từ renderer.
