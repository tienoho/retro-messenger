# Realtime Protocol

## Durable command

- Send message: REST `POST /api/v1/conversations/{id}/messages`.
- Edit/delete/read: REST trong các milestone tiếp theo.

## SignalR server events

- `MessageReceived(MessageDto)`
- `TypingChanged(conversationId, userId, isTyping)`
- `BuzzReceived(conversationId, senderId, sentAt)`

## SignalR client methods

- `SubscribeConversation(conversationId)`
- `StartTyping(conversationId)`
- `StopTyping(conversationId)`
- `SendBuzz(conversationId)`

## Guarantees

- Message phải có `clientMessageId`.
- Retry cùng sender + clientMessageId trả message cũ.
- Production chỉ phát `MessageReceived` sau database commit/outbox.
- Reconnect không thay thế sync cursor.
