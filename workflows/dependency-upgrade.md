# Workflow — Dependency Upgrade

1. Đọc changelog.
2. Kiểm tra breaking change và license.
3. Nâng một nhóm dependency cùng hệ sinh thái.
4. Restore/install với lockfile.
5. Build/typecheck/test.
6. Test runtime liên quan.
7. Kiểm tra bundle/container size.
8. Kiểm tra CVE.
9. Cập nhật documentation.
10. Không nâng đồng loạt framework lớn và business feature trong cùng PR.
