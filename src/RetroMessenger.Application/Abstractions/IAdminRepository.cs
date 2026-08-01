using RetroMessenger.Contracts.Admin;

namespace RetroMessenger.Application.Abstractions;

public interface IAdminRepository
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AdminUserDto>> ListUsersAsync(int limit, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<AdminAuditLogDto>> ListAuditLogsAsync(int limit, CancellationToken cancellationToken = default);
    Task SetUserSuspensionAsync(
        Guid actorId,
        Guid targetUserId,
        bool suspended,
        string reason,
        CancellationToken cancellationToken = default);
}
