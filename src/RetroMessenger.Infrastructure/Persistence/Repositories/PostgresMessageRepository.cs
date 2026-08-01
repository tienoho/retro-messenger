using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Domain.Messaging;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresMessageRepository(MessengerDbContext db) : IMessageRepository
{
    public async Task<Message?> FindByClientMessageIdAsync(
        Guid senderId,
        string clientMessageId,
        CancellationToken cancellationToken)
    {
        var entity = await db.Messages
            .AsNoTracking()
            .FirstOrDefaultAsync(
                m => m.SenderId == senderId && m.ClientMessageId == clientMessageId,
                cancellationToken);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<IReadOnlyList<Message>> ListAsync(
        Guid conversationId,
        long? afterSequence,
        int limit,
        CancellationToken cancellationToken)
    {
        limit = Math.Clamp(limit, 1, 100);

        var query = db.Messages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId);

        if (afterSequence.HasValue)
        {
            query = query.Where(m => m.SequenceNo > afterSequence.Value);
        }

        var entities = await query
            .OrderBy(m => m.SequenceNo)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return entities.Select(MapToDomain).ToList();
    }

    public async Task AddAsync(
        Message message,
        CancellationToken cancellationToken)
    {
        var entity = new MessageEntity
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            ClientMessageId = message.ClientMessageId,
            SequenceNo = message.Sequence,
            MessageType = (short)message.Type,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            EditedAt = message.EditedAt,
            DeletedAt = message.DeletedAt
        };

        var dto = message.ToDto();
        var outbox = new OutboxMessageEntity
        {
            Id = Guid.CreateVersion7(),
            EventType = "MessageCreatedIntegrationEvent",
            Payload = JsonSerializer.Serialize(dto),
            OccurredAt = message.CreatedAt
        };

        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            if (db.Database.CurrentTransaction is null && db.Database.IsRelational())
            {
                await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
                db.Messages.Add(entity);
                db.OutboxMessages.Add(outbox);
                await db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
            else
            {
                db.Messages.Add(entity);
                db.OutboxMessages.Add(outbox);
                await db.SaveChangesAsync(cancellationToken);
            }
        });
    }

    private static Message MapToDomain(MessageEntity entity)
    {
        return new Message(
            entity.Id,
            entity.ConversationId,
            entity.SenderId,
            entity.ClientMessageId,
            entity.SequenceNo,
            (MessageType)entity.MessageType,
            entity.Content,
            entity.CreatedAt,
            entity.EditedAt,
            entity.DeletedAt);
    }
}
