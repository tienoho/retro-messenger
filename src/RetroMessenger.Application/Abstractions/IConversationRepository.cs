using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Application.Abstractions;

public interface IConversationRepository
{
    Task<IReadOnlyList<Conversation>> ListAsync(Guid userId, CancellationToken cancellationToken);
    Task<Conversation?> GetAsync(Guid conversationId, CancellationToken cancellationToken);
    Task<long> NextSequenceAsync(Guid conversationId, CancellationToken cancellationToken);
    Task<Conversation> GetOrCreateDirectConversationAsync(Guid currentUserId, Guid targetUserId, string title, CancellationToken cancellationToken);
    Task<Conversation> CreateConversationAsync(string title, short conversationType, IEnumerable<Guid> memberIds, CancellationToken cancellationToken);
    Task AddMemberAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken);
}
