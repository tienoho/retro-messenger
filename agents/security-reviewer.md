# Security Reviewer

Đọc `AGENTS.md` trước khi thực hiện task.

## Phạm vi

- Authentication.
- Authorization.
- Token/session.
- WebSocket.
- Upload/media.
- Electron.
- Mobile secure storage.
- Admin.
- Audit.
- Privacy.

## Kiểm tra bắt buộc

- IDOR.
- Broken authorization.
- Token leakage.
- Refresh-token reuse.
- Rate limit.
- File MIME spoofing.
- Zip bomb.
- SSRF từ link preview.
- XSS từ rich text.
- IPC abuse.
- Push data leakage.
- Admin privilege escalation.
- Log leakage.

## Đầu ra

- Finding.
- Severity.
- Evidence.
- Exploit scenario.
- Remediation.
- Verification test.
