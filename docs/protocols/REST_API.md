# REST API

Base URL local: `http://localhost:5080`.

## Authentication

| Method | Path | Auth | Mục đích |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Tạo Identity và profile cùng GUID trong một transaction |
| POST | `/api/v1/auth/login` | Public | Cấp access token và refresh token |
| POST | `/api/v1/auth/refresh` | Refresh token | Cấp cặp token mới |
| POST | `/api/v1/auth/logout` | Refresh token | Revoke token family của phiên hiện tại |
| GET | `/api/v1/session` | Bearer | Lấy user của phiên hiện tại |

Access token gửi bằng `Authorization: Bearer <token>`. Token có issuer/audience cố định và claim `token_family`; mỗi request xác minh family còn active trong PostgreSQL và account chưa bị lockout. Access token không được chấp nhận ở vị trí refresh token. Mỗi lần refresh sẽ consume token cũ và cấp token mới trong cùng family; replay token đã consume hoặc logout sẽ revoke cả family, khiến REST và SignalR từ chối access token cũ ngay lập tức. Database chỉ lưu SHA-256, không lưu raw refresh token.

Login/register/refresh/logout và OpenIddict token endpoints có fixed-window limit theo IP. Counter local bảo vệ từng process; Redis phối hợp nhiều API instance và vẫn giữ ngưỡng qua restart. Khi Redis lỗi, limiter local tiếp tục hoạt động. Sai username/password luôn trả cùng `401`; 5 lần sai khóa account 15 phút. Vượt ngưỡng trả `429`, code `AUTH_RATE_LIMITED` và header `Retry-After`.

## API chức năng

| Method | Path | Auth | Mục đích |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| GET | `/api/v1/conversations` | Bearer | Danh sách hội thoại của user |
| GET | `/api/v1/conversations/{id}/messages` | Bearer + membership | Lịch sử, hỗ trợ `afterSequence` |
| POST | `/api/v1/conversations/{id}/messages` | Bearer + membership | Durable send-message command |
| GET/PUT | `/api/v1/users/me...` | Bearer | Profile và presence status |
| GET | `/api/v1/contacts/` | Bearer | Danh bạ thật của user hiện tại |
| POST | `/api/v1/contacts/requests` | Bearer | Gửi request tới username đã tồn tại |
| GET | `/api/v1/contacts/requests` | Bearer | Liệt kê request pending mà user là recipient |
| POST | `/api/v1/contacts/requests/{id}/accept` | Bearer + recipient ownership | Accept và tạo hai relationship đối xứng |
| GET/POST | `/api/v1/rooms...` | Tùy operation | Danh sách/tạo/join room |
| POST | `/api/v1/media/upload-url` | Bearer + membership | Tạo attachment `uploading` và presigned PUT URL |
| POST | `/api/v1/media/{id}/complete` | Bearer + uploader ownership | HEAD object, xác nhận size/content type và chuyển `pending` |
| GET | `/api/v1/media/{id}/status` | Bearer + membership | Đọc trạng thái xử lý attachment |
| GET | `/api/v1/media/{id}` | Bearer + membership + `ready` | Tạo presigned private download URL |
| POST | `/api/v1/calls/token` | Bearer | Call token boundary |

Frontend permission không thay thế authorization backend. Endpoint đọc/ghi message đều kiểm tra membership; mutation luôn lấy user ID từ authenticated principal, không nhận impersonation header.

## Media

Client gọi `upload-url`, PUT bytes trực tiếp tới object storage với đúng `Content-Type`, rồi gọi `complete`. Chỉ uploader được complete; mọi member của conversation được đọc status và tải file đã `ready`. `complete` idempotent từ trạng thái `pending`, `processing` hoặc `ready`.

Nếu object thiếu, size hoặc content type metadata không khớp, API trả `400`; mismatch bị xóa khỏi storage và attachment chuyển `failed`. Worker atomically claim attachment `pending` hoặc lease `processing` đã hết hạn, sniff nội dung thật, scan virus rồi owner-CAS sang `ready`, `quarantined` hoặc `failed`. Failure tạm thời dùng bounded exponential backoff; object upload dở/terminal quá retention được cleanup nhưng metadata vẫn giữ. Message lưu token bền vững `[attachment:<uuid>] filename`, không lưu presigned URL có hạn.

Contact request lưu riêng `sender_id` và `recipient_id`. User không phải recipient nhận `403`; request không tồn tại nhận `404`; self-request, duplicate hoặc request đã xử lý nhận `400`.

## Admin API

Mọi endpoint dưới đây yêu cầu Bearer token có role `admin` và policy tương ứng:

| Method | Path | Policy |
|---|---|---|
| GET | `/api/admin/v1/overview` | `admin.users.read` |
| GET | `/api/admin/v1/users?limit=50` | `admin.users.read` |
| POST | `/api/admin/v1/users/{id}/suspension` | `admin.users.suspend` |
| GET | `/api/admin/v1/audit?limit=50` | `admin.audit.read` |

Suspension body là `{ "suspended": true, "reason": "..." }`. Reason bắt buộc 10–500 ký tự; admin không được thao tác lên chính mình. Anonymous nhận `401`, authenticated non-admin nhận `403`.

## Gửi tin nhắn

```json
{
  "clientMessageId": "client-generated-uuid",
  "content": "Xin chào"
}
```

`clientMessageId` phải ổn định qua retry và duy nhất theo sender. Retry trả lại message đã tồn tại với `isDuplicate=true`. Sequence, message và outbox commit trong cùng transaction trước khi publish SignalR.

## Status code và lỗi

- `400`: request/domain validation thất bại.
- `401`: thiếu, hết hạn hoặc sai authentication credential.
- `403`: đã xác thực nhưng không có quyền trên object.
- `404`: resource không tồn tại.
- `500`: lỗi ngoài dự kiến.

Lỗi do exception handler dùng RFC 7807 `ProblemDetails`, kèm `code` và `traceId` khi response body có thể được ghi.
