---
name: security-review
description: Use for threat modeling and security review of authentication, authorization, uploads, URLs, Electron IPC, mobile storage, admin, and privacy.
---

# SKILL — Security Review

## Trigger

Auth, permission, upload, Electron IPC, admin action, privacy hoặc external URL.

## Procedure

1. Xác định trust boundary.
2. Xác định attacker.
3. Kiểm tra authentication.
4. Kiểm tra object-level authorization.
5. Kiểm tra input/file/url.
6. Kiểm tra secret/log.
7. Kiểm tra rate limit.
8. Viết abuse test.
9. Xác nhận remediation.

## Output

Finding có severity, evidence, impact, fix và verification.
