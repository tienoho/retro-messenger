using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Application.Abstractions;

public interface IMessageRepository
{
    Task<Message?> FindByClientMessageIdAsync(Guid senderId, string clientMessageId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Message>> ListAsync(Guid conversationId, long? afterSequence, int limit, CancellationToken cancellationToken);
    Task AddAsync(Message message, CancellationToken cancellationToken);
}
