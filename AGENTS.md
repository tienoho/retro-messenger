# AGENTS.md — Retro Messenger

## 1. Vai trò của tài liệu

Đây là chỉ dẫn gốc cho mọi coding agent làm việc trong repository Retro Messenger. Mọi agent phải đọc tài liệu này trước khi phân tích, sửa mã, tạo file hoặc đề xuất kiến trúc.

## 2. Bối cảnh hệ thống

Retro Messenger là nền tảng chat đa nền tảng lấy cảm hứng từ Yahoo Messenger nhưng dùng thương hiệu và tài nguyên riêng.

### Backend

- .NET 10
- ASP.NET Core
- SignalR + MessagePack
- PostgreSQL
- EF Core cho write model
- Dapper cho read model phức tạp
- Redis cho presence, typing, cache và coordination
- Wolverine cho handler, durable messaging và transactional outbox
- Hangfire cho recurring/operational jobs
- OpenIddict + ASP.NET Core Identity
- MinIO hoặc Cloudflare R2
- LiveKit cho voice/video
- OpenTelemetry

### Client

- Web: React + Vite + Fluent UI
- Desktop: Electron + React + SQLite
- Mobile: React Native + Expo Prebuild + FlashList + SQLite
- Admin: React + Refine + Ant Design
- Monorepo: pnpm + Turborepo

## 3. Phạm vi và thứ tự ưu tiên

- File `AGENTS.md` gần file đang chỉnh nhất có ưu tiên trong phạm vi thư mục đó.
- Root `AGENTS.md` áp dụng cho toàn repository nếu không có file scoped cụ thể hơn.
- Yêu cầu trực tiếp của người dùng và policy bảo mật luôn cao hơn tài liệu repository.
- `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` và `.cursor/rules/` là adapter; không được mâu thuẫn với file này.
- Nếu phát hiện mâu thuẫn, dừng thay đổi có rủi ro và ghi rõ conflict trong handoff.

## 4. Luật kiến trúc bắt buộc

1. `Domain` không phụ thuộc ASP.NET Core, EF Core, Redis, SignalR, OpenIddict hoặc hạ tầng.
2. `Application` chỉ phụ thuộc `Domain` và `Contracts`.
3. `Infrastructure` triển khai abstraction của `Application`.
4. API không chứa nghiệp vụ cốt lõi.
5. Worker không được bypass domain rule.
6. Không phát message realtime trước khi PostgreSQL commit.
7. Không dùng Redis làm source of truth.
8. Không dùng SignalR cho upload, download, audio hoặc video.
9. Durable command đi qua REST; realtime push đi qua SignalR.
10. Mỗi request thay đổi dữ liệu phải kiểm tra authorization ở backend.
11. Mỗi schema change phải có migration và rollback/compatibility analysis.
12. Mỗi realtime contract change phải đánh giá backward compatibility.
13. Generated API client không được sửa thủ công.
14. Không thêm package mới khi thư viện hiện có đã giải quyết được yêu cầu.
15. Không đưa Kafka, Kubernetes, event sourcing hoặc microservice mới vào nếu không có ADR được chấp thuận.

## 5. Quy trình bắt buộc trước khi sửa mã

Agent phải:

1. Đọc file liên quan trực tiếp.
2. Xác định module sở hữu dữ liệu.
3. Tìm test hiện có.
4. Xác định contract REST/realtime/database bị ảnh hưởng.
5. Nêu giả định nếu dữ liệu chưa đủ.
6. Chọn workflow phù hợp trong `workflows/`.
7. Chỉ sửa phạm vi cần thiết.

## 6. Quy trình sau khi sửa mã

Agent phải:

1. Chạy format.
2. Chạy lint/typecheck.
3. Chạy unit test.
4. Chạy integration test liên quan.
5. Kiểm tra migration nếu có.
6. Kiểm tra contract generation nếu API đổi.
7. Cập nhật tài liệu.
8. Ghi rõ phần chưa kiểm thử được.

## 7. Cấm

- Không dùng `.Result`, `.Wait()` hoặc blocking I/O trong hot path .NET.
- Không log token, mật khẩu, OTP hoặc nội dung chat riêng tư.
- Không tạo generic repository cho toàn bộ EF Core chỉ để bọc `DbSet`.
- Không đặt business rule trong controller, endpoint hoặc SignalR Hub.
- Không mở SQLite từ nhiều Electron renderer.
- Không lưu refresh token trong LocalStorage, AsyncStorage hoặc SQLite plaintext.
- Không dùng frontend permission làm lớp bảo mật duy nhất.
- Không dùng `any` tràn lan trong TypeScript.
- Không nuốt exception.
- Không để retry vô hạn mà thiếu backoff và idempotency.

## 8. Cách chọn agent

- Điều phối nhiều agent: `agents/orchestrator.md`
- Kiến trúc tổng thể: `agents/solution-architect.md`
- Yêu cầu sản phẩm: `agents/product-owner.md`
- Backend .NET: `agents/dotnet-backend.md`
- SignalR/realtime: `agents/realtime-signalr.md`
- Web: `agents/web-frontend.md`
- Electron: `agents/electron-desktop.md`
- React Native: `agents/react-native-mobile.md`
- Admin: `agents/admin-portal.md`
- PostgreSQL: `agents/database-postgresql.md`
- DevOps/monitoring: `agents/devops-observability.md`
- Security: `agents/security-reviewer.md`
- Test: `agents/qa-automation.md`
- Review cuối: `agents/code-reviewer.md`

## 9. Đầu ra chuẩn

Mỗi lần hoàn thành task, agent phải báo:

- Phạm vi đã xử lý.
- File đã thay đổi.
- Quyết định kỹ thuật.
- Test đã chạy.
- Rủi ro còn lại.
- Migration hoặc contract impact.
- Việc cần agent khác tiếp tục.
