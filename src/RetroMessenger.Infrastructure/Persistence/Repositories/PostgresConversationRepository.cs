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
}
