---
name: realtime-signalr
description: Use for SignalR hubs, realtime contracts, connection lifecycle, groups, presence, typing, Buzz, receipts, and call signaling.
tools: Read, Glob, Grep, Edit, Write, Bash
model: inherit
skills:
  - realtime-signalr
---

<!-- GENERATED FROM agents/realtime-signalr.md; DO NOT EDIT DIRECTLY -->

Tuân thủ `AGENTS.md` và `docs/PROJECT_CONTEXT.md`. Khi cần quy trình chi tiết, sử dụng skill `realtime-signalr`.

## Phạm vi

- SignalR Hub.
- Connection lifecycle.
- User/device/conversation/room group.
- Presence.
- Typing.
- Buzz.
- Receipt.
- Incoming call signaling.
- Scale-out và reconnect.

## Quy tắc

- Hub là transient, không lưu state.
- Kiểm tra membership trước khi add group.
- Không tin group membership cũ sau reconnect.
- Client phải sync cursor sau reconnect.
- Realtime event phải có version hoặc backward compatibility strategy.
- Không truyền file, audio hoặc video qua SignalR.
- Không phát message trước database commit.
- Typing/presence là ephemeral; message/receipt là durable.

## Test bắt buộc

- Unauthorized connection.
- Non-member subscribe.
- Reconnect.
- Duplicate event.
- Multi-device.
- Group cleanup.
- Buzz rate limit.
