using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Admin;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresAdminRepository(MessengerDbContext db) : IAdminRepository
{
    public async Task<AdminOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var userCount = await db.Profiles.CountAsync(cancellationToken);
        var conversationCount = await db.Conversations.CountAsync(cancellationToken);
        var pendingOutboxCount = await db.OutboxMessages.CountAsync(
            x => x.ProcessedAt == null && !x.IsQuarantined,
            cancellationToken);
        var activeRefreshSessionCount = await db.RefreshSessions.CountAsync(
            x =>
                x.ConsumedAt == null &&
                x.RevokedAt == null &&
                x.ExpiresAt > now,
            cancellationToken);

        return new AdminOverviewDto(
            userCount,
            conversationCount,
            pendingOutboxCount,
            activeRefreshSessionCount);
    }

    public async Task<IReadOnlyCollection<AdminUserDto>> ListUsersAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await (
            from profile in db.Profiles.AsNoTracking()
            join identity in db.Users.AsNoTracking()
                on profile.Id equals identity.Id into identities
            from identity in identities.DefaultIfEmpty()
            orderby profile.CreatedAt descending
            select new AdminUserDto(
                profile.Id,
                profile.Username,
                profile.DisplayName,
                profile.Status,
                identity != null && identity.LockoutEnd != null && identity.LockoutEnd > now,
                profile.CreatedAt))
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<AdminAuditLogDto>> ListAuditLogsAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        return await (
            from audit in db.AdminAuditLogs.AsNoTracking()
            join actor in db.Profiles.AsNoTracking()
                on audit.ActorId equals actor.Id
            orderby audit.OccurredAt descending
            select new AdminAuditLogDto(
                audit.Id,
                actor.Id,
                actor.Username,
                audit.Action,
                audit.TargetType,
                audit.TargetId,
                audit.Reason,
                audit.OccurredAt))
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task SetUserSuspensionAsync(
        Guid actorId,
        Guid targetUserId,
        bool suspended,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var targetExists = await db.Profiles.AsNoTracking()
            .AnyAsync(x => x.Id == targetUserId, cancellationToken);
        var identityExists = await db.Users.AsNoTracking()
            .AnyAsync(x => x.Id == targetUserId, cancellationToken);
        if (!targetExists || !identityExists)
        {
            throw new KeyNotFoundException("Target user was not found.");
        }

        if (!db.Database.IsRelational())
        {
            await SetUserSuspensionInMemoryAsync(
                actorId,
                targetUserId,
                suspended,
                reason,
                cancellationToken);
            return;
        }

        IDbContextTransaction? transaction = null;
        if (db.Database.CurrentTransaction is null)
        {
            transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        }

        try
        {
            var now = DateTimeOffset.UtcNow;
            var lockoutEnd = suspended ? DateTimeOffset.MaxValue : (DateTimeOffset?)null;
            await db.Users
                .Where(x => x.Id == targetUserId)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(x => x.LockoutEnabled, true)
                        .SetProperty(x => x.LockoutEnd, lockoutEnd)
                        .SetProperty(x => x.UpdatedAt, now),
                    cancellationToken);

            if (suspended)
            {
                await db.Profiles
                    .Where(x => x.Id == targetUserId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(x => x.Status, "offline")
                            .SetProperty(x => x.UpdatedAt, now),
                        cancellationToken);
            }

            db.AdminAuditLogs.Add(CreateAudit(
                actorId,
                targetUserId,
                suspended,
                reason,
                now));
            await db.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (transaction is not null)
            {
                await transaction.RollbackAsync(CancellationToken.None);
            }

            throw;
        }
        finally
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync();
            }
        }
    }

    private async Task SetUserSuspensionInMemoryAsync(
        Guid actorId,
        Guid targetUserId,
        bool suspended,
        string reason,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var identity = await db.Users.SingleAsync(x => x.Id == targetUserId, cancellationToken);
        identity.LockoutEnabled = true;
        identity.LockoutEnd = suspended ? DateTimeOffset.MaxValue : null;
        identity.UpdatedAt = now;

        if (suspended)
        {
            var profile = await db.Profiles.SingleAsync(x => x.Id == targetUserId, cancellationToken);
            profile.Status = "offline";
            profile.UpdatedAt = now;
        }

        db.AdminAuditLogs.Add(CreateAudit(
            actorId,
            targetUserId,
            suspended,
            reason,
            now));
        await db.SaveChangesAsync(cancellationToken);
    }

    private static AdminAuditLogEntity CreateAudit(
        Guid actorId,
        Guid targetUserId,
        bool suspended,
        string reason,
        DateTimeOffset occurredAt) =>
        new()
        {
            Id = Guid.CreateVersion7(),
            ActorId = actorId,
            Action = suspended ? "user.suspended" : "user.restored",
            TargetType = "user",
            TargetId = targetUserId,
            Reason = reason,
            OccurredAt = occurredAt
        };
}
