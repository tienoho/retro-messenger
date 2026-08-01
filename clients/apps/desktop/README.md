# @retro/desktop

Ứng dụng Electron Windows của Retro Messenger với SignalR, cache SQLite, outbox offline, contacts, presence/typing/Buzz, attachment, tray, notification và auto-update.

## Phát triển

- API mặc định: `http://localhost:5080`; đặt `RETRO_API_URL` cho endpoint HTTPS khác.
- `pnpm --filter @retro/desktop typecheck`
- `pnpm --filter @retro/desktop test`
- `pnpm --filter @retro/desktop build`
- `pnpm --filter @retro/desktop test:electron`
- `pnpm --filter @retro/desktop package:win` tạo NSIS x64. Bản local không có PFX sẽ là unsigned và không được coi là production release.

Linux từ chối đăng nhập nếu `safeStorage` chỉ có backend `basic_text`. Stable/beta Windows được phát hành bằng workflow `desktop-release.yml` và bắt buộc có signing secrets.
