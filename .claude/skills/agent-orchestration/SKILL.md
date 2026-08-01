---
name: agent-orchestration
description: Use when coordinating multiple specialist agents, selecting workflows, managing handoffs, and verifying end-to-end completion.
---

# SKILL — Agent Orchestration

## Trigger

Dùng khi task cần nhiều agent, nhiều module hoặc nhiều bước kiểm định độc lập.

## Procedure

1. Xác định task type và workflow.
2. Chọn một agent chính sở hữu kết quả cuối.
3. Chọn agent hỗ trợ theo boundary, không theo số lượng file.
4. Xác định thứ tự và dependency giữa các agent.
5. Yêu cầu mỗi agent tạo handoff theo template.
6. Tổng hợp test evidence, migration, contract và security impact.
7. Chạy Definition of Done trước khi đóng task.

## Guardrails

- Không để hai agent sửa cùng file đồng thời mà thiếu owner hợp nhất.
- Không bỏ qua specialist về dữ liệu hoặc security cho task rủi ro cao.
- Không tuyên bố hoàn thành khi còn handoff chưa xử lý.
