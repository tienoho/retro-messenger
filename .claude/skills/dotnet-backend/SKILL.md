---
name: dotnet-backend
description: Use for ASP.NET Core APIs, domain rules, handlers, EF Core, Dapper, OpenIddict, Wolverine, Hangfire, and backend integrations.
---

# SKILL — .NET Backend

## Trigger

REST API, domain handler, authentication, EF Core, Dapper, Wolverine, Hangfire hoặc provider integration.

## Procedure

1. Xác định module ownership.
2. Tạo/đổi command hoặc query.
3. Viết validator.
4. Đặt invariant trong domain.
5. Tạo persistence mapping.
6. Dùng transaction.
7. Phát integration event qua outbox.
8. Trả `ProblemDetails`.
9. Viết unit và integration test.
10. Cập nhật OpenAPI nếu contract đổi.

## Guardrails

- Async end-to-end.
- Cancellation token.
- Không blocking.
- Không broadcast trước commit.
- Không generic repository không cần thiết.
