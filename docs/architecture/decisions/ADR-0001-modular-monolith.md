# ADR-0001 — Bắt đầu bằng Modular Monolith

## Status

Accepted

## Context

Sản phẩm có nhiều domain nhưng đội phát triển ban đầu cần transaction đơn giản, debug nhanh và deployment ít thành phần.

## Decision

Dùng một ASP.NET Core API host với các boundary Domain/Application/Infrastructure rõ ràng. Worker là process riêng cho background processing. Chỉ tách service khi metric và ownership chứng minh cần thiết.

## Consequences

- Giao dịch message dễ bảo đảm hơn.
- Ít network hop và operational overhead.
- Cần architecture tests để tránh module coupling.
- Media, notification, search và public-room gateway có thể tách sau.
