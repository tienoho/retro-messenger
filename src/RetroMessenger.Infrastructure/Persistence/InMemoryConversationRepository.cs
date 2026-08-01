using System.Collections.Concurrent;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Infrastructure.Persistence;

public sealed class InMemoryConversationRepository : IConversationRepository
{
    private readonly ConcurrentDictionary<Guid, Conversation> _items = new();

    public InMemoryConversationRepository()
    {
        _items[DemoData.Conversation.Id] = DemoData.Conversation;
    }

    public Task<IReadOnlyList<Conversation>> ListAsync(Guid userId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        IReadOnlyList<Conversation> result = _items.Values
            .Where(x => x.HasMember(userId))
            .OrderBy(x => x.Title)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<Conversation?> GetAsync(Guid conversationId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _items.TryGetValue(conversationId, out var item);
        return Task.FromResult(item);
    }

    public Task<long> NextSequenceAsync(Guid conversationId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_items.TryGetValue(conversationId, out var item))
        {
            throw new KeyNotFoundException("Conversation was not found.");
        }

        lock (item)
        {
            return Task.FromResult(item.NextSequence());
        }
    }
}
