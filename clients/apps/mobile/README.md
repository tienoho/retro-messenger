# @retro/mobile

Ứng dụng Expo SDK 57/React Native với FlashList, secure session, API client và SQLite schema.

- Refresh token chỉ lưu trong Keychain/Keystore qua `expo-secure-store`.
- Khởi động và resume sẽ refresh, xoay vòng rồi lưu lại refresh token mới.
- Lỗi mạng tạm thời không xóa phiên đã lưu; token bị backend từ chối sẽ bị xóa.
- `pnpm --filter @retro/mobile test` chạy regression test cho lifecycle phiên.
- `pnpm exec expo export --platform all` kiểm tra Metro bundle Android, iOS và Web.

Xem `../../README.md` và tài liệu tương ứng trong `docs/frontend/`.
