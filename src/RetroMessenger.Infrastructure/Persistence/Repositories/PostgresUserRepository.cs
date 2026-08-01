using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Users;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresUserRepository(MessengerDbContext db) : IUserRepository
{
    public async Task<UserDto?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var entity = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);
        return entity is null ? null : new UserDto(entity.Id, entity.Username, entity.DisplayName, entity.Status, entity.CustomStatus);
    }

    public async Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        var entity = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.Username == username, cancellationToken);
        return entity is null ? null : new UserDto(entity.Id, entity.Username, entity.DisplayName, entity.Status, entity.CustomStatus);
    }

    public async Task<UserDto> CreateAsync(Guid userId, string username, string displayName, CancellationToken cancellationToken = default)
    {
        var entity = new UserProfileEntity
        {
            Id = userId,
            Username = username,
            DisplayName = displayName,
            Status = "online",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Profiles.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return new UserDto(entity.Id, entity.Username, entity.DisplayName, entity.Status, entity.CustomStatus);
    }

    public async Task<UserDto> UpdateAsync(Guid userId, string displayName, string? customStatus, string status, CancellationToken cancellationToken = default)
    {
        var entity = await db.Profiles.FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);
        if (entity is null)
        {
            entity = new UserProfileEntity
            {
                Id = userId,
                Username = "user",
                DisplayName = displayName,
                CustomStatus = customStatus,
                Status = status,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Profiles.Add(entity);
        }
        else
        {
            entity.DisplayName = displayName;
            entity.CustomStatus = customStatus;
            entity.Status = status;
            entity.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
        return new UserDto(entity.Id, entity.Username, entity.DisplayName, entity.Status, entity.CustomStatus);
    }
}
