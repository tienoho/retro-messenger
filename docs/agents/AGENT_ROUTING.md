# Agent Routing

## Nguyên tắc

- Một task có đúng một agent chính chịu trách nhiệm kết quả cuối.
- Agent hỗ trợ được chọn theo boundary kỹ thuật hoặc rủi ro, không theo số lượng file.
- Security, database và deployment review là lớp bổ sung; chúng không thay agent triển khai chính.
- Dùng `orchestrator` khi task đi qua từ hai module trở lên hoặc cần nhiều handoff.

## Bảng định tuyến

| Agent | Skill | Chế độ | Khi sử dụng |
|---|---|---|---|
| `orchestrator` | `agent-orchestration` | Triển khai | Coordinates multi-agent work, selects specialists and workflows, enforces handoffs, and verifies completion across Retro Messenger. |
| `solution-architect` | `solution-architecture` | Đọc/review | Use for architecture decisions, module boundaries, deployment topology, scalability, ADRs, and cross-cutting changes. |
| `product-owner` | `product-specification` | Đọc/review | Use to convert product requests into testable specifications, business rules, acceptance criteria, scope, and edge cases. |
| `dotnet-backend` | `dotnet-backend` | Triển khai | Use for ASP.NET Core, domain logic, application handlers, EF Core, Dapper, OpenIddict, Wolverine, Hangfire, and provider integrations. |
| `realtime-signalr` | `realtime-signalr` | Triển khai | Use for SignalR hubs, realtime contracts, connection lifecycle, groups, presence, typing, Buzz, receipts, and call signaling. |
| `web-frontend` | `web-frontend` | Triển khai | Use for the React web messenger, Fluent UI wrappers, IndexedDB, TanStack Query, Zustand, message timelines, and web accessibility. |
| `electron-desktop` | `electron-desktop` | Triển khai | Use for Electron main/preload/renderer boundaries, windows, tray, native notifications, secure storage, SQLite, updates, and desktop Buzz. |
| `react-native-mobile` | `react-native-mobile` | Triển khai | Use for React Native mobile, SQLite, foreground/background lifecycle, push, SignalR, LiveKit, native permissions, and calls. |
| `admin-portal` | `admin-portal` | Triển khai | Use for the Refine and Ant Design admin portal, moderation, permissions, audit, feature flags, and operations dashboards. |
| `database-postgresql` | `database-postgresql` | Triển khai | Use for PostgreSQL schema, migrations, indexes, query plans, concurrency, retention, backup, and data repair. |
| `devops-observability` | `devops-observability` | Triển khai | Use for Docker, CI/CD, Nginx, deployment, health checks, OpenTelemetry, monitoring, backup, releases, and rollback. |
| `security-reviewer` | `security-review` | Đọc/review | Use proactively for authentication, authorization, uploads, Electron IPC, mobile storage, admin actions, privacy, and threat review. |
| `qa-automation` | `qa-testing` | Triển khai | Use for unit, integration, contract, E2E, load, concurrency, failure-mode, and regression test design or implementation. |
| `code-reviewer` | `code-review` | Đọc/review | Use after implementation to review correctness, architecture, security, data integrity, concurrency, performance, tests, and documentation. |

## Chuỗi agent thường dùng

### Feature thông thường

`product-owner → solution-architect → specialist → qa-automation → code-reviewer`

### Thay đổi message/realtime

`product-owner → realtime-signalr + dotnet-backend → web/mobile/desktop → qa-automation → security-reviewer → code-reviewer`

### Migration dữ liệu

`solution-architect → database-postgresql → dotnet-backend → devops-observability → qa-automation → code-reviewer`

### Incident/hotfix

`orchestrator → specialist → security-reviewer (nếu liên quan) → qa-automation → devops-observability`
