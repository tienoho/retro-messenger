# GitHub Copilot Instructions — Retro Messenger

- Treat root `AGENTS.md` as the authoritative project instruction file.
- The system is a modular monolith: .NET 10, ASP.NET Core, PostgreSQL, SignalR, Wolverine, Redis, React, Electron, React Native, and Refine Admin.
- PostgreSQL is the source of truth. SignalR and Redis are not message stores.
- Durable commands use REST; server push uses SignalR. Never broadcast a message before its database transaction commits.
- Every message uses a client message ID for idempotency and a monotonic sequence within its conversation.
- Domain cannot depend on Infrastructure. Keep endpoints and hubs thin.
- Use generated TypeScript API clients; do not edit generated files manually.
- Web uses TanStack Query for server state, Zustand for UI state, and IndexedDB for durable local chat state.
- Mobile uses SQLite and secure OS credential storage; background delivery uses push and resume uses cursor sync.
- Electron renderer must not access Node.js directly. IPC must be typed, whitelisted, and validated.
- Admin UI permissions do not replace backend authorization; sensitive actions require reason and audit.
- Add regression tests for bug fixes and appropriate integration tests for data, auth, realtime, or provider changes.
- Specialist agent profiles are available in `.github/agents/`; path-specific rules are in `.github/instructions/`.
