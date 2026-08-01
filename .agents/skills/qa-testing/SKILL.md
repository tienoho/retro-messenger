---
name: qa-testing
description: Use for test strategy and implementation across unit, integration, contract, E2E, load, concurrency, failure, and regression testing.
---

# SKILL — QA & Testing

## Trigger

Feature mới, bug fix, release hoặc refactor lớn.

## Procedure

1. Chuyển acceptance criteria thành test matrix.
2. Chọn unit/integration/E2E/load.
3. Ưu tiên dữ liệu thật qua Testcontainers.
4. Viết regression test.
5. Test failure mode.
6. Test concurrency khi liên quan message/sequence.
7. Ghi evidence và command.

## Guardrails

- Không chỉ test happy path.
- Không xóa test fail để pipeline xanh.
