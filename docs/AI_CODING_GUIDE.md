# AI Coding Guide

## Nguyên tắc giao việc cho AI

Một task tốt phải nêu:

- Mục tiêu.
- Module sở hữu.
- Phạm vi file.
- Acceptance criteria.
- Điều không được thay đổi.
- Test cần chạy.
- Contract hoặc migration impact.

## Prompt mẫu

```text
Đọc AGENTS.md, agents/dotnet-backend.md,
skills/dotnet-backend/SKILL.md và workflows/feature-development.md.

Thực hiện task theo templates/task.md.
Không thay đổi public contract ngoài phạm vi.
Sau khi sửa, chạy build và test liên quan.
Báo rõ file thay đổi, test đã chạy và rủi ro còn lại.
```

## Phân công nhiều agent

1. Product Owner tạo feature spec.
2. Architect xác nhận boundary.
3. Specialist triển khai.
4. Security Reviewer kiểm tra.
5. QA viết test matrix.
6. Code Reviewer review cuối.
7. Agent chính tổng hợp handoff.

## Ngăn context drift

Mỗi agent phải quay lại `AGENTS.md` khi:

- Task kéo dài qua nhiều module.
- Có yêu cầu mới giữa chừng.
- Phát hiện kiến trúc hiện tại khác giả định.
- Cần thêm dependency hoặc service mới.
