---
applyTo: "src/**/*.cs,tests/**/*.cs"
---

# Dotnet Instructions

Follow `AGENTS.md` and the .NET modular-monolith boundaries. Keep endpoints and SignalR hubs thin. Put invariants in Domain and orchestration in Application. Use async end-to-end and pass CancellationToken. Do not broadcast before PostgreSQL commit. Add unit and integration tests for behavior changes.
