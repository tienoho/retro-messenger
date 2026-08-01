---
name: code-review
description: Use to review a change for correctness, architecture, security, data integrity, concurrency, performance, tests, and maintainability.
---

# SKILL — Code Review

## Trigger

Dùng sau implementation, trước merge, hoặc khi cần đánh giá một diff/PR.

## Procedure

1. Đọc task và acceptance criteria.
2. Đọc toàn bộ diff trước khi nhận xét chi tiết.
3. Kiểm tra breaking change và compatibility.
4. Kiểm tra auth, data integrity, transaction và idempotency.
5. Kiểm tra failure mode, retry và concurrency.
6. Kiểm tra performance và resource use.
7. Kiểm tra test evidence, migration và documentation.
8. Báo finding theo severity, file, impact và cách sửa.

## Guardrails

- Ưu tiên lỗi correctness, security và dữ liệu trước style.
- Không approve khi test evidence không tương xứng với rủi ro.
