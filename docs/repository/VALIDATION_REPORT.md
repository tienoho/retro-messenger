# Repository Validation Report

## Final audit scope

- ZIP/file-list integrity.
- Required root files and standard repository documentation.
- Backend module/layer directory completeness.
- `.slnx`, `.csproj`, `.props` XML parsing and project-reference resolution.
- Client workspace package names and `workspace:*` dependency resolution.
- JSON, YAML, JavaScript, TypeScript/TSX syntax and shell syntax.
- Markdown fence, frontmatter and relative-link validation.
- Claude, Gemini, Copilot, Cursor and Codex agent adapters.
- Node demo health, conversations, send-message and idempotent retry.
- Docker/Expo/Electron targeted regression guards.

## Findings corrected during review

1. Khôi phục `docs/PROJECT_CONTEXT.md`, `docs/AGENT_ROUTING.md` và `docs/TOOL_COMPATIBILITY.md` về đúng vị trí mà agent adapters tham chiếu.
2. Đổi Worker runtime image sang ASP.NET runtime để khớp `Microsoft.AspNetCore.App` framework reference.
3. Sửa Electron `main` output sang `out/main/index.js` theo cấu trúc electron-vite.
4. Loại cấu hình Babel Expo Router đã lỗi thời.
5. Bổ sung lock idempotency cho concurrent retry trong in-memory starter.
6. Bổ sung `ProblemDetails` exception handler và tách endpoint theo đúng API structure.
7. Bổ sung toàn bộ module/backend folder map và client feature/route/widget/provider structure đã đặc tả.
8. Bổ sung các shared package còn thiếu: realtime contracts, auth core, config, logger, web/mobile UI và config packages.
9. Bổ sung tài liệu repository, ADR, API, database, deployment, testing, operations và GitHub templates.
10. Mở rộng validator để tự phát hiện file rỗng, missing directory, broken project/workspace reference, stale manifest và cấu hình regression.

## Automated result

```text
PASS: agent pack structure and adapters are consistent.
PASS: repository structure, references, manifests and agent adapters are consistent.
PASS: Markdown relative links resolve.
PASS: TypeScript/TSX syntax.
PASS: JavaScript syntax.
PASS: shell syntax.
PASS: demo health, conversations, send and idempotent retry.
```

## Environment limitations

Môi trường tạo artifact không có .NET SDK, Docker daemon và không thể truy cập npm/NuGet registry. Vì vậy chưa chạy được:

- `dotnet build` và .NET runtime smoke test.
- `pnpm install`, full typecheck có dependency, Vite/Electron/Expo build.
- `docker compose up` và integration test PostgreSQL/Redis/MinIO/LiveKit.

GitHub Actions đã bao phủ các bước build khi repository chạy trong môi trường có dependency đầy đủ.
