# Contributing

## Chuẩn bị

1. Đọc `AGENTS.md` và `docs/PROJECT_CONTEXT.md`.
2. Chọn workflow phù hợp trong `workflows/`.
3. Tạo issue hoặc task có acceptance criteria.
4. Không trộn dependency upgrade lớn với business feature trong cùng PR.

## Kiểm tra bắt buộc

```bash
python3 scripts/validate_repository.py
python3 scripts/validate_agent_pack.py
bash scripts/smoke_demo.sh

dotnet build RetroMessenger.slnx
dotnet run --project tests/RetroMessenger.SmokeTests

cd clients
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Các lệnh .NET/pnpm chỉ chạy khi môi trường đã cài dependency tương ứng.

## Commit và Pull Request

- Commit nhỏ, mô tả hành vi thay đổi.
- PR phải ghi rõ migration, contract, security và rollback impact.
- Bug fix phải có regression test.
- Generated code và lockfile không chỉnh thủ công ngoài workflow tương ứng.
