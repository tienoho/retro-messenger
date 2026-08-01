# Authentication Infrastructure

Identity lưu account/lockout; `IdentityService` phát JWT HMAC-SHA256 có issuer, audience, `jti` và `token_family`. Refresh token được hash SHA-256 trong `auth.refresh_sessions`, rotate một lần và revoke toàn family khi replay/logout.

`AccessTokenSessionValidator` chạy sau cryptographic validation, kiểm tra PostgreSQL còn refresh session active trong family và account không bị lockout. Vì vậy REST và SignalR từ chối access token ngay sau logout, refresh replay hoặc admin suspension.

Auth endpoints dùng fixed-window limiter theo IP: limiter local của ASP.NET Core chặn sớm, còn `RedisAuthRateLimitStore` phối hợp counter giữa nhiều API instance. Redis chỉ là coordination state có TTL; khi Redis lỗi, local limiter vẫn hoạt động và PostgreSQL vẫn là source of truth cho token revocation.

Không log token/password, không đưa raw IP vào Redis key và không trả thông báo phân biệt username tồn tại.
