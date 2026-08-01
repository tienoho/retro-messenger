# Security Baseline

- Không dùng thương hiệu, logo hoặc asset độc quyền của Yahoo.
- Production phải có authentication và object-level authorization.
- Token web dùng HttpOnly cookie/BFF; mobile/desktop dùng PKCE và OS secure storage.
- Electron bật context isolation, tắt node integration và chỉ expose typed IPC.
- Upload phải dùng presigned URL, MIME verification, virus scan và quarantine.
- Link preview phải chống SSRF.
- Rich text phải dùng schema whitelist, không lưu HTML tùy ý.
- Admin action nhạy cảm cần reason, permission và audit.
- Không log access token, refresh token, OTP hoặc nội dung chat mặc định.
- Access token phải có issuer/audience, session-family validation và bị từ chối ngay khi refresh family revoke hoặc account bị khóa.
- Auth endpoint phải có local + distributed rate limit; chỉ tin client IP do server connection hoặc trusted proxy cung cấp.
