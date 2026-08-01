using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Admin;
using RetroMessenger.Domain.Common;

namespace RetroMessenger.Application.Admin;

public sealed class AdminService(IAdminRepository repository)
{
    public Task<AdminOverviewDto> GetOverviewAsync(
        CancellationToken cancellationToken = default) =>
        repository.GetOverviewAsync(cancellationToken);

    public Task<IReadOnlyCollection<AdminUserDto>> ListUsersAsync(
        int limit,
        CancellationToken cancellationToken = default) =>
        repository.ListUsersAsync(Math.Clamp(limit, 1, 100), cancellationToken);

    public Task<IReadOnlyCollection<AdminAuditLogDto>> ListAuditLogsAsync(
        int limit,
        CancellationToken cancellationToken = default) =>
        repository.ListAuditLogsAsync(Math.Clamp(limit, 1, 100), cancellationToken);

    public Task SetUserSuspensionAsync(
        Guid actorId,
        Guid targetUserId,
        SetUserSuspensionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (actorId == targetUserId)
        {
            throw new DomainException("Administrators cannot change their own suspension state.");
        }

        var reason = request.Reason.Trim();
        if (reason.Length is < 10 or > 500)
        {
            throw new DomainException("Administrative action reason must contain 10 to 500 characters.");
        }

        return repository.SetUserSuspensionAsync(
            actorId,
            targetUserId,
            request.Suspended,
            reason,
            cancellationToken);
    }
}
