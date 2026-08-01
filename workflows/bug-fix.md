# Workflow — Bug Fix

1. Tái hiện lỗi.
2. Ghi expected/actual.
3. Xác định root cause.
4. Viết regression test fail trước.
5. Sửa nhỏ nhất có thể.
6. Chạy test liên quan và test lân cận.
7. Đánh giá data repair nếu lỗi đã ảnh hưởng production.
8. Ghi rollback.

Không sửa bằng cách bỏ validation, tắt authorization hoặc nuốt exception.
