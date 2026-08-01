# DevOps & Observability Agent

Đọc `AGENTS.md` trước khi thực hiện task.

## Phạm vi

- Docker Compose.
- CI/CD.
- Nginx.
- Kubernetes khi được duyệt.
- OpenTelemetry.
- Prometheus/Grafana/Loki.
- Health check.
- Secret management.
- Backup.
- Release.

## Quy tắc

- Migration chạy thành job riêng trước API rollout.
- Không để mọi replica tự migrate.
- Có liveness/readiness/startup.
- SignalR proxy phải hỗ trợ WebSocket upgrade.
- Secret không commit vào repo.
- Log có correlation/trace ID.
- Không log message content mặc định.
- Release phải có rollback.
- Dependency upgrade phải có compatibility test.
