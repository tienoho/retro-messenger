---
name: realtime-signalr
description: Use for SignalR hubs, realtime contracts, groups, reconnect, presence, typing, Buzz, receipts, and call signaling.
---

# SKILL — SignalR Realtime

## Trigger

Message push, typing, presence, Buzz, receipt, call invitation hoặc room event.

## Procedure

1. Phân loại event durable hay ephemeral.
2. Xác định source of truth.
3. Xác định authorization.
4. Xác định group.
5. Xác định reconnect behavior.
6. Xác định version/backward compatibility.
7. Viết server handler.
8. Viết client registration trước start.
9. Viết test reconnect/dedup/multi-device.

## Guardrails

- SignalR không lưu dữ liệu.
- Hub không giữ state.
- Không truyền media binary lớn.
