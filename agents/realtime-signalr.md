# Realtime & SignalR Agent

Đọc `AGENTS.md` trước khi thực hiện task.

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
