# Testing Strategy

## Backend

- Domain unit test cho invariant.
- Integration test với PostgreSQL/Redis thực qua Testcontainers.
- Concurrency test cho sequence và idempotency.
- Authorization test cho mọi object-scoped endpoint.

## Client

- Shared package unit test.
- Web Playwright.
- Electron Playwright.
- Mobile Maestro và lifecycle test.
- Admin permission matrix.

## Starter smoke tests

```bash
bash scripts/smoke_demo.sh
dotnet run --project tests/RetroMessenger.SmokeTests
```
