using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Application.Messaging;

public static class MessageMapper
{
    public static MessageDto ToDto(this Message message) =>
        new(
            message.Id,
            message.ConversationId,
            message.SenderId,
            message.ClientMessageId,
            message.Sequence,
            message.Type,
            message.Content,
            message.CreatedAt,
            message.EditedAt,
            message.DeletedAt);
}
