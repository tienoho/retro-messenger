using RetroMessenger.Contracts.Users;

namespace RetroMessenger.Application.Abstractions;

public interface IUserRepository
{
    Task<UserDto?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserDto?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(Guid userId, string username, string displayName, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAsync(Guid userId, string displayName, string? customStatus, string status, CancellationToken cancellationToken = default);
}
