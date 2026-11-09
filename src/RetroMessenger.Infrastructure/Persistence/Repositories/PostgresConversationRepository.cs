using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Domain.Messaging;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresConversationRepository(MessengerDbContext db) : IConversationRepository
{
    public async Task<IReadOnlyList<Conversation>> ListAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var conversationEntities = await db.Conversations
            .AsNoTracking()
            .Where(c => db.ConversationMembers.Any(m => m.ConversationId == c.Id && m.UserId == userId))
            .Include(c => c.Members)
            .OrderBy(c => c.Title)
            .ToListAsync(cancellationToken);

        return conversationEntities
            .Select(c => new Conversation(c.Id, c.Title, c.Members.Select(m => m.UserId)))
            .ToList();
    }

    public async Task<Conversation?> GetAsync(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var entity = await db.Conversations
            .AsNoTracking()
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken);

        if (entity is null) return null;

        return new Conversation(
            entity.Id,
            entity.Title,
            entity.Members.Select(m => m.UserId));
    }

    public async Task<long> NextSequenceAsync(
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        if (!db.Database.IsRelational())
        {
            var entity = await db.Conversations.FindAsync([conversationId], cancellationToken)
                ?? throw new KeyNotFoundException("Conversation was not found.");
            entity.LastSequence++;
            entity.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
            return entity.LastSequence;
        }

        var connection = db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        const string sql = """
            UPDATE chat.conversations
            SET last_sequence = last_sequence + 1,
                updated_at = NOW()
            WHERE id = @ConversationId
            RETURNING last_sequence;
            """;

        var command = new CommandDefinition(
            sql,
            new { ConversationId = conversationId },
            transaction: db.Database.CurrentTransaction?.GetDbTransaction(),
            cancellationToken: cancellationToken);

        var result = await connection.ExecuteScalarAsync<long?>(command);

        if (result is null)
        {
            throw new KeyNotFoundException("Conversation was not found.");
        }

        return result.Value;
    }

    public async Task<Conversation> GetOrCreateDirectConversationAsync(
        Guid currentUserId,
        Guid targetUserId,
        string title,
        CancellationToken cancellationToken)
    {
        var existing = await db.Conversations
            .Include(c => c.Members)
            .Where(c => c.ConversationType == 1 &&
                        c.Members.Any(m => m.UserId == currentUserId) &&
                        c.Members.Any(m => m.UserId == targetUserId))
            .FirstOrDefaultAsync(cancellationToken);

        if (existing is not null)
        {
            return new Conversation(
                existing.Id,
                existing.Title,
                existing.Members.Select(m => m.UserId));
        }

        var id = Guid.CreateVersion7();
        var conversationEntity = new ConversationEntity
        {
            Id = id,
            Title = title,
            ConversationType = 1,
            LastSequence = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Members = new List<ConversationMemberEntity>
            {
                new() { ConversationId = id, UserId = currentUserId, JoinedAt = DateTimeOffset.UtcNow },
                new() { ConversationId = id, UserId = targetUserId, JoinedAt = DateTimeOffset.UtcNow }
            }
        };

        db.Conversations.Add(conversationEntity);
        await db.SaveChangesAsync(cancellationToken);

        return new Conversation(
            conversationEntity.Id,
            conversationEntity.Title,
            conversationEntity.Members.Select(m => m.UserId));
    }

    public async Task<Conversation> CreateConversationAsync(
        string title,
        short conversationType,
        IEnumerable<Guid> memberIds,
        CancellationToken cancellationToken)
    {
        var id = Guid.CreateVersion7();
        var membersList = memberIds.Distinct().ToList();
        var entity = new ConversationEntity
        {
            Id = id,
            Title = title,
            ConversationType = conversationType,
            LastSequence = 0,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Members = membersList.Select(m => new ConversationMemberEntity
            {
                ConversationId = id,
                UserId = m,
                JoinedAt = DateTimeOffset.UtcNow
            }).ToList()
        };

        db.Conversations.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return new Conversation(entity.Id, entity.Title, entity.Members.Select(m => m.UserId));
    }

    public async Task AddMemberAsync(
        Guid conversationId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var exists = await db.ConversationMembers
            .AnyAsync(m => m.ConversationId == conversationId && m.UserId == userId, cancellationToken);
        if (!exists)
        {
            db.ConversationMembers.Add(new ConversationMemberEntity
            {
                ConversationId = conversationId,
                UserId = userId,
                JoinedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
