using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Contacts;
using RetroMessenger.Domain.Common;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresContactRepository(MessengerDbContext db) : IContactRepository
{
    public async Task<IReadOnlyCollection<FriendDto>> GetContactsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from contact in db.Contacts.AsNoTracking()
            join profile in db.Profiles.AsNoTracking()
                on contact.ContactId equals profile.Id
            where contact.UserId == userId && contact.Status == "accepted"
            orderby profile.DisplayName, profile.Username
            select new FriendDto(
                profile.Id,
                profile.Username,
                profile.DisplayName,
                profile.Status,
                contact.GroupName))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<FriendRequestDto>> GetPendingRequestsAsync(
        Guid recipientId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from request in db.ContactRequests.AsNoTracking()
            join sender in db.Profiles.AsNoTracking()
                on request.SenderId equals sender.Id
            where request.RecipientId == recipientId && request.Status == "pending"
            orderby request.CreatedAt
            select new FriendRequestDto(
                request.Id,
                sender.Id,
                sender.DisplayName,
                request.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<ContactRequestStateDto> GetRequestStateAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var incoming = await (
            from request in db.ContactRequests.AsNoTracking()
            join sender in db.Profiles.AsNoTracking() on request.SenderId equals sender.Id
            where request.RecipientId == userId && request.Status == "pending"
            orderby request.CreatedAt
            select new FriendRequestDto(
                request.Id, sender.Id, sender.DisplayName, request.CreatedAt,
                request.RecipientId, null, "incoming"))
            .ToListAsync(cancellationToken);
        var outgoing = await (
            from request in db.ContactRequests.AsNoTracking()
            join recipient in db.Profiles.AsNoTracking() on request.RecipientId equals recipient.Id
            where request.SenderId == userId && request.Status == "pending"
            orderby request.CreatedAt
            select new FriendRequestDto(
                request.Id, request.SenderId, string.Empty, request.CreatedAt,
                recipient.Id, recipient.DisplayName, "outgoing"))
            .ToListAsync(cancellationToken);
        return new ContactRequestStateDto(incoming, outgoing);
    }

    public async Task<IReadOnlyCollection<BlockedContactDto>> GetBlockedContactsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await (
            from relationship in db.Contacts.AsNoTracking()
            join profile in db.Profiles.AsNoTracking() on relationship.ContactId equals profile.Id
            where relationship.UserId == userId && relationship.Status == "blocked"
            orderby profile.DisplayName, profile.Username
            select new BlockedContactDto(
                profile.Id, profile.Username, profile.DisplayName, relationship.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<FriendRequestDto> AddRequestAsync(
        Guid senderId,
        string targetUsername,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(targetUsername))
        {
            throw new DomainException("Target username is required.");
        }

        var normalizedTarget = targetUsername.Trim();
        var sender = await db.Profiles.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == senderId, cancellationToken)
            ?? throw new KeyNotFoundException("Sender profile was not found.");
        var recipient = await db.Profiles.AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.Username == normalizedTarget,
                cancellationToken)
            ?? throw new KeyNotFoundException("Target user was not found.");

        if (recipient.Id == senderId)
        {
            throw new DomainException("A user cannot add themselves as a contact.");
        }

        if (await IsBlockedPairAsync(senderId, recipient.Id, cancellationToken))
        {
            throw new DomainException("A contact request cannot be sent between blocked users.");
        }

        if (await db.Contacts.AsNoTracking().AnyAsync(
                x => x.UserId == senderId && x.ContactId == recipient.Id,
                cancellationToken))
        {
            throw new DomainException("The users are already contacts.");
        }

        if (await db.ContactRequests.AsNoTracking().AnyAsync(
                x =>
                    x.Status == "pending" &&
                    ((x.SenderId == senderId && x.RecipientId == recipient.Id) ||
                     (x.SenderId == recipient.Id && x.RecipientId == senderId)),
                cancellationToken))
        {
            throw new DomainException("A contact request already exists between these users.");
        }


        var processedRequests = await db.ContactRequests
            .Where(x => x.Status != "pending" &&
                ((x.SenderId == senderId && x.RecipientId == recipient.Id) ||
                 (x.SenderId == recipient.Id && x.RecipientId == senderId)))
            .ToListAsync(cancellationToken);
        db.ContactRequests.RemoveRange(processedRequests);

        var request = new ContactRequestEntity
        {
            Id = Guid.CreateVersion7(),
            SenderId = senderId,
            RecipientId = recipient.Id,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.ContactRequests.Add(request);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw new DomainException("A contact request already exists between these users.");
        }

        return new FriendRequestDto(
            request.Id,
            sender.Id,
            sender.DisplayName,
            request.CreatedAt);
    }

    public async Task AcceptRequestAsync(
        Guid requestId,
        Guid recipientId,
        CancellationToken cancellationToken = default)
    {
        var request = await db.ContactRequests.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == requestId, cancellationToken)
            ?? throw new KeyNotFoundException("Contact request was not found.");

        if (request.RecipientId != recipientId)
        {
            throw new UnauthorizedAccessException("Only the request recipient can accept it.");
        }

        if (!string.Equals(request.Status, "pending", StringComparison.Ordinal))
        {
            throw new DomainException("Contact request has already been processed.");
        }

        if (!db.Database.IsRelational())
        {
            await AcceptInMemoryAsync(requestId, request, cancellationToken);
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
            var affected = await db.ContactRequests
                .Where(x => x.Id == requestId && x.Status == "pending")
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(x => x.Status, "accepted")
                        .SetProperty(x => x.RespondedAt, now),
                    cancellationToken);
            if (affected != 1)
            {
                throw new DomainException("Contact request has already been processed.");
            }

            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO contacts.contact_relationships
                    (user_id, contact_id, status, group_name, created_at)
                VALUES
                    ({request.SenderId}, {request.RecipientId}, 'accepted', 'Bạn bè', {now}),
                    ({request.RecipientId}, {request.SenderId}, 'accepted', 'Bạn bè', {now})
                ON CONFLICT (user_id, contact_id) DO NOTHING
                """, cancellationToken);

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

    public Task RejectRequestAsync(
        Guid requestId,
        Guid recipientId,
        CancellationToken cancellationToken = default) =>
        RespondAsync(requestId, recipientId, recipientOwnsRequest: true, "rejected", delete: false, cancellationToken);

    public Task CancelRequestAsync(
        Guid requestId,
        Guid senderId,
        CancellationToken cancellationToken = default) =>
        RespondAsync(requestId, senderId, recipientOwnsRequest: false, "cancelled", delete: true, cancellationToken);

    public async Task<BlockedContactDto> BlockAsync(
        Guid userId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        if (userId == targetUserId) throw new DomainException("A user cannot block themselves.");
        var target = await db.Profiles.AsNoTracking().SingleOrDefaultAsync(
            x => x.Id == targetUserId,
            cancellationToken) ?? throw new KeyNotFoundException("Target user was not found.");
        var now = DateTimeOffset.UtcNow;

        if (!db.Database.IsRelational())
        {
            var relationships = await db.Contacts.Where(x =>
                (x.UserId == userId && x.ContactId == targetUserId) ||
                (x.UserId == targetUserId && x.ContactId == userId)).ToListAsync(cancellationToken);
            db.Contacts.RemoveRange(relationships);
            var requests = await db.ContactRequests.Where(x =>
                (x.SenderId == userId && x.RecipientId == targetUserId) ||
                (x.SenderId == targetUserId && x.RecipientId == userId)).ToListAsync(cancellationToken);
            db.ContactRequests.RemoveRange(requests);
            db.Contacts.Add(new ContactEntity
            {
                UserId = userId,
                ContactId = targetUserId,
                Status = "blocked",
                GroupName = "Blocked",
                CreatedAt = now
            });
            await db.SaveChangesAsync(cancellationToken);
        }
        else
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            await db.Contacts.Where(x =>
                (x.UserId == userId && x.ContactId == targetUserId) ||
                (x.UserId == targetUserId && x.ContactId == userId)).ExecuteDeleteAsync(cancellationToken);
            await db.ContactRequests.Where(x =>
                (x.SenderId == userId && x.RecipientId == targetUserId) ||
                (x.SenderId == targetUserId && x.RecipientId == userId)).ExecuteDeleteAsync(cancellationToken);
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO contacts.contact_relationships
                    (user_id, contact_id, status, group_name, created_at)
                VALUES ({userId}, {targetUserId}, 'blocked', 'Blocked', {now})
                """, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        return new BlockedContactDto(target.Id, target.Username, target.DisplayName, now);
    }

    public async Task UnblockAsync(
        Guid userId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        var relationship = await db.Contacts.SingleOrDefaultAsync(
            x => x.UserId == userId && x.ContactId == targetUserId && x.Status == "blocked",
            cancellationToken) ?? throw new KeyNotFoundException("Blocked contact was not found.");
        db.Contacts.Remove(relationship);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> IsBlockedPairAsync(
        Guid firstUserId,
        Guid secondUserId,
        CancellationToken cancellationToken = default) =>
        db.Contacts.AsNoTracking().AnyAsync(x =>
            x.Status == "blocked" &&
            ((x.UserId == firstUserId && x.ContactId == secondUserId) ||
             (x.UserId == secondUserId && x.ContactId == firstUserId)),
            cancellationToken);

    private async Task RespondAsync(
        Guid requestId,
        Guid actorId,
        bool recipientOwnsRequest,
        string status,
        bool delete,
        CancellationToken cancellationToken)
    {
        var request = await db.ContactRequests.SingleOrDefaultAsync(
            x => x.Id == requestId,
            cancellationToken) ?? throw new KeyNotFoundException("Contact request was not found.");
        var ownerId = recipientOwnsRequest ? request.RecipientId : request.SenderId;
        if (ownerId != actorId) throw new UnauthorizedAccessException("The contact request is owned by another user.");
        if (request.Status != "pending") throw new DomainException("Contact request has already been processed.");
        if (delete)
        {
            db.ContactRequests.Remove(request);
        }
        else
        {
            request.Status = status;
            request.RespondedAt = DateTimeOffset.UtcNow;
        }
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task AcceptInMemoryAsync(
        Guid requestId,
        ContactRequestEntity snapshot,
        CancellationToken cancellationToken)
    {
        var request = await db.ContactRequests.SingleAsync(
            x => x.Id == requestId,
            cancellationToken);
        request.Status = "accepted";
        request.RespondedAt = DateTimeOffset.UtcNow;

        if (!await db.Contacts.AnyAsync(
                x => x.UserId == snapshot.SenderId && x.ContactId == snapshot.RecipientId,
                cancellationToken))
        {
            db.Contacts.Add(new ContactEntity
            {
                UserId = snapshot.SenderId,
                ContactId = snapshot.RecipientId,
                Status = "accepted",
                GroupName = "Bạn bè",
                CreatedAt = request.RespondedAt.Value
            });
            db.Contacts.Add(new ContactEntity
            {
                UserId = snapshot.RecipientId,
                ContactId = snapshot.SenderId,
                Status = "accepted",
                GroupName = "Bạn bè",
                CreatedAt = request.RespondedAt.Value
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
