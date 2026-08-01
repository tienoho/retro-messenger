# @retro/admin

Operations portal dùng React và Ant Design.

```powershell
pnpm --filter @retro/admin dev --host 127.0.0.1
pnpm --filter @retro/admin typecheck
pnpm --filter @retro/admin test
pnpm --filter @retro/admin build
```

API mặc định được proxy tới `http://localhost:5080`; có thể đặt `VITE_API_URL`. Chỉ account có Identity role `admin` đăng nhập được dashboard. Action suspend/restore bắt buộc reason và được backend ghi audit.
