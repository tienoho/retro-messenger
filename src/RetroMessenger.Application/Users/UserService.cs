using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Users;

namespace RetroMessenger.Application.Users;

public sealed class UserService(
    IUserRepository userRepo,
    IPresencePublisher? presencePublisher = null)
{
    private static readonly Guid DefaultUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    public async Task<UserDto> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userRepo.GetByIdAsync(userId, cancellationToken);
        return user ?? new UserDto(userId, "user", "Bạn", "online");
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        return await userRepo.UpdateAsync(userId, request.DisplayName.Trim(), request.CustomStatus?.Trim(), "online", cancellationToken);
    }

    public async Task<UserDto> UpdateStatusAsync(Guid userId, UpdateStatusRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await userRepo.GetByIdAsync(userId, cancellationToken);
        var displayName = existing?.DisplayName ?? "Bạn";
        var customStatus = existing?.CustomStatus;
        var updated = await userRepo.UpdateAsync(userId, displayName, customStatus, request.Status, cancellationToken);
        if (presencePublisher is not null)
        {
            await presencePublisher.PublishAsync(
                userId,
                updated.Status,
                updated.CustomStatus,
                DateTimeOffset.UtcNow,
                cancellationToken);
        }
        return updated;
    }
}
