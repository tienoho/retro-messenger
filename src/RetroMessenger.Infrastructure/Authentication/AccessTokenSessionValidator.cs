using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;

namespace RetroMessenger.Infrastructure.Authentication;

public sealed class AccessTokenSessionValidator(MessengerDbContext db)
    : IAccessTokenSessionValidator
{
    public Task<bool> IsActiveAsync(
        Guid userId,
        Guid familyId,
        CancellationToken cancellationToken = default)
    {
        if (userId == Guid.Empty || familyId == Guid.Empty)
        {
            return Task.FromResult(false);
        }

        var now = DateTimeOffset.UtcNow;
        return db.RefreshSessions
            .AsNoTracking()
            .AnyAsync(
                session =>
                    session.UserId == userId &&
                    session.FamilyId == familyId &&
                    session.RevokedAt == null &&
                    session.ExpiresAt > now &&
                    db.Users.Any(user =>
                        user.Id == userId &&
                        (user.LockoutEnd == null || user.LockoutEnd <= now)),
                cancellationToken);
    }
}
