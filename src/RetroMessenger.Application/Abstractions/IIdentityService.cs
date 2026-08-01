namespace RetroMessenger.Application.Abstractions;

public interface IIdentityService
{
    Task<(bool Succeeded, string[] Errors, Guid UserId)> RegisterUserAsync(
        string username, string displayName, string password, CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string[] Errors, Guid UserId)> ValidateUserCredentialsAsync(
        string username, string password, CancellationToken cancellationToken = default);

    Task<(string AccessToken, string RefreshToken)> GenerateTokensAsync(
        Guid userId, string username, CancellationToken cancellationToken = default);

    Task<(bool Succeeded, string AccessToken, string RefreshToken, Guid UserId, string Username)> RefreshTokenAsync(
        string refreshToken, CancellationToken cancellationToken = default);

    Task RevokeTokenAsync(string token, CancellationToken cancellationToken = default);
}
