# Lockfile Policy

`pnpm-lock.yaml` phải được sinh bằng phiên bản pnpm ghi trong `packageManager` sau lần cài dependency đầu tiên:

```bash
cd clients
corepack enable
pnpm install
```

Artifact này không chứa lockfile giả vì môi trường tạo ZIP không có Internet để resolve registry metadata. Sau khi sinh, lockfile phải được commit và CI chuyển sang `pnpm install --frozen-lockfile`.
