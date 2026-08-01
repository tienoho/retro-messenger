# Security Policy

## Báo cáo lỗ hổng

Không tạo public issue cho lỗ hổng chưa được khắc phục. Gửi báo cáo riêng cho security owner của repository, kèm:

- Phiên bản/commit.
- Bước tái hiện.
- Phạm vi ảnh hưởng.
- Proof of concept an toàn.
- Đề xuất khắc phục nếu có.

## Phạm vi nhạy cảm

- Authentication, refresh token và device session.
- Object-level authorization trong conversation/room/admin.
- Upload, link preview và media processing.
- Electron IPC/preload.
- Mobile secure storage, push payload và incoming call.
- Admin permission và audit.

## Baseline

Đọc `docs/security/SECURITY_BASELINE.md` và chạy workflow `workflows/security-review.md` trước release.
