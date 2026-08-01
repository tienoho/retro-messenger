# Generated API Client

## Responsibility

Output của OpenAPI generator. Không chỉnh sửa generated TypeScript thủ công; starter hiện dùng wrapper viết tay tại `src/index.ts`.

## Rules

- Chỉ phụ thuộc layer/package được kiến trúc cho phép.
- Public contract phải typed và có test khi triển khai code.
- Không lưu secret hoặc bypass authorization.
