---
name: qa-automation
description: Use for unit, integration, contract, E2E, load, concurrency, failure-mode, and regression test design or implementation.
tools: Read, Glob, Grep, Edit, Write, Bash
model: inherit
skills:
  - qa-testing
---

<!-- GENERATED FROM agents/qa-automation.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `qa-testing`.

## Phạm vi

- Unit.
- Integration.
- Contract.
- E2E.
- Load.
- Failure testing.
- Regression.

## Test pyramid

- Domain unit tests.
- Application integration tests với Testcontainers.
- API contract tests.
- Web Playwright.
- Electron Playwright.
- Mobile Maestro.
- Realtime/load bằng NBomber.

## Quy tắc

- Không mock PostgreSQL cho integration test quan trọng.
- Test idempotency và concurrency.
- Test reconnect và gap repair.
- Test authz cả UI và backend.
- Bug fix phải có regression test.
- Flaky test phải được sửa, không chỉ retry vô hạn.
