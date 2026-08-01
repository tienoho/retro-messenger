using System.Collections.Concurrent;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Infrastructure.Persistence;

public sealed class InMemoryMessageRepository : IMessageRepository
{
    private readonly ConcurrentDictionary<Guid, Message> _items = new();
    private readonly object _writeLock = new();

    public InMemoryMessageRepository()
    {
        foreach (var message in DemoData.Messages)
        {
            _items[message.Id] = message;
        }
    }

    public Task<Message?> FindByClientMessageIdAsync(
        Guid senderId,
        string clientMessageId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var item = _items.Values.FirstOrDefault(
            x => x.SenderId == senderId &&
                 string.Equals(
                     x.ClientMessageId,
                     clientMessageId,
                     StringComparison.Ordinal));

        return Task.FromResult(item);
    }

    public Task<IReadOnlyList<Message>> ListAsync(
        Guid conversationId,
        long? afterSequence,
        int limit,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        limit = Math.Clamp(limit, 1, 100);

        IReadOnlyList<Message> result = _items.Values
            .Where(x => x.ConversationId == conversationId)
            .Where(x =>
                afterSequence is null ||
                x.Sequence > afterSequence.Value)
            .OrderBy(x => x.Sequence)
            .Take(limit)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task AddAsync(
        Message message,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_writeLock)
        {
            var duplicate = _items.Values.Any(
                x => x.SenderId == message.SenderId &&
                     x.ClientMessageId ==
                     message.ClientMessageId);

            if (duplicate)
            {
                throw new InvalidOperationException(
                    "Duplicate client message ID.");
            }

            if (!_items.TryAdd(message.Id, message))
            {
                throw new InvalidOperationException(
                    "Message ID already exists.");
            }
        }

        return Task.CompletedTask;
    }
}
