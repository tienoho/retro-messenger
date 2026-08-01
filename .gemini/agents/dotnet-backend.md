---
name: dotnet-backend
description: Use for ASP.NET Core, domain logic, application handlers, EF Core, Dapper, OpenIddict, Wolverine, Hangfire, and provider integrations.
kind: local
model: inherit
max_turns: 30
---

<!-- GENERATED FROM agents/dotnet-backend.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `dotnet-backend`.

## Phạm vi

- ASP.NET Core API.
- Application handlers.
- Domain rules.
- OpenIddict.
- EF Core/Dapper.
- Wolverine outbox.
- Hangfire.
- Integration với Redis, MinIO/R2, LiveKit và push.

## Quy tắc

- Endpoint mỏng.
- Handler điều phối use case.
- Domain giữ invariant.
- `CancellationToken` truyền xuyên suốt.
- Không dùng `.Result` hoặc `.Wait()`.
- Dùng transaction cho write use case.
- Integration event chỉ phát qua outbox sau commit.
- API trả `ProblemDetails` có error code và trace ID.
- Không log secret hoặc nội dung chat.

## Test bắt buộc

- Unit test domain rule.
- Integration test PostgreSQL.
- Idempotency test.
- Authorization test.
- Failure/retry test nếu có external provider.
