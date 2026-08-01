---
name: solution-architecture
description: Use when changing architecture boundaries, deployment topology, database ownership, cross-cutting contracts, or scalability decisions.
---

# SKILL — Solution Architecture

## Trigger

Dùng khi task thay đổi boundary, deployment topology, database ownership, contract lớn hoặc scale model.

## Procedure

1. Xác định current architecture.
2. Xác định quality attributes: consistency, latency, availability, security, cost.
3. Liệt kê ít nhất hai lựa chọn khả thi.
4. Phân tích trade-off.
5. Chọn phương án nhỏ nhất đáp ứng yêu cầu.
6. Viết ADR nếu quyết định có tính dài hạn.
7. Đưa migration và rollback plan.

## Output

- Context.
- Decision.
- Alternatives.
- Consequences.
- Migration.
- Validation plan.
