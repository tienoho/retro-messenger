# Workflow — Agent Orchestration

1. Đọc task và chọn workflow nghiệp vụ chính.
2. Chỉ định một agent chính chịu trách nhiệm kết quả cuối.
3. Xác định các review bắt buộc: architecture, database, security, QA hoặc DevOps.
4. Lập dependency giữa các agent và tránh sửa trùng file.
5. Mỗi agent tạo handoff bằng `templates/handoff.md`.
6. Agent chính hợp nhất code và xử lý conflict.
7. QA xác nhận evidence.
8. Code Reviewer kiểm tra cuối.
9. Orchestrator chạy Definition of Done và tổng hợp phần còn lại.
