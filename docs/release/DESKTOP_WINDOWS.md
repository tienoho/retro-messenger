# Phát hành Desktop Windows

## Chuẩn bị

1. Đặt version SemVer trong `clients/apps/desktop/package.json`.
2. Stable dùng version thường, ví dụ `0.2.0`; beta dùng prerelease, ví dụ `0.2.0-beta.1`.
3. Tạo GitHub encrypted secrets:
   - `WINDOWS_PFX_BASE64`: nội dung PFX đã base64;
   - `WINDOWS_PFX_PASSWORD`: mật khẩu PFX.
4. Chứng thư phải hỗ trợ Authenticode code signing và còn hiệu lực.

## Phát hành

Chạy workflow **Desktop Windows release** với tag `v<version>` và channel `stable` hoặc `beta`. Workflow sẽ:

- install bằng lockfile;
- chạy typecheck, unit/failure test, production build và Electron smoke;
- sinh icon, đóng gói NSIS x64 và ký executable;
- chặn release nếu `Get-AuthenticodeSignature` không trả `Valid`;
- tạo SHA-256, license SBOM và GitHub Release sau mọi gate.

Auto-update dùng metadata `.yml` và `.blockmap` trong cùng GitHub Release. Không upload metadata thủ công trước khi installer đã ký.

## Rollback

Không hạ version. Sửa lỗi trên source của bản ổn định trước, tăng patch version và phát hành lại. Giữ installer cũ trên GitHub Releases để phục hồi thủ công khi cần.

## Xác minh còn cần môi trường ngoài repo

- Cài trên Windows VM sạch.
- Upgrade bản ký N → N+1 qua GitHub.
- Kiểm tra session, cache và outbox còn nguyên sau update.
- Kiểm tra SmartScreen/reputation bằng chứng thư phát hành thật.
