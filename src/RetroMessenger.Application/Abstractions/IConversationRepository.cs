using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Application.Abstractions;

public interface IConversationRepository
{
    Task<IReadOnlyList<Conversation>> ListAsync(Guid userId, CancellationToken cancellationToken);
    Task<Conversation?> GetAsync(Guid conversationId, CancellationToken cancellationToken);
    Task<long> NextSequenceAsync(Guid conversationId, CancellationToken cancellationToken);
}
