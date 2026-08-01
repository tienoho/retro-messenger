using System.Security.Authentication;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Authentication;
using RetroMessenger.Contracts.Users;
using RetroMessenger.Domain.Common;

namespace RetroMessenger.Application.Identity;

public sealed class AuthService(
    IUserRepository userRepo,
    IIdentityService identityService,
    ITransactionRunner? transactionRunner = null)
{
    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var (succeeded, errors, userId) = await identityService.ValidateUserCredentialsAsync(username, request.Password, cancellationToken);
        if (!succeeded)
        {
            throw new AuthenticationException(string.Join(", ", errors));
        }

        var user = await userRepo.GetByIdAsync(userId, cancellationToken)
            ?? await userRepo.GetByUsernameAsync(username, cancellationToken)
            ?? throw new KeyNotFoundException("User profile not found.");

        var (accessToken, refreshToken) = await identityService.GenerateTokensAsync(user.Id, user.Username, cancellationToken);

        return new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            User: user);
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var displayName = request.DisplayName.Trim();

        var existingUser = await userRepo.GetByUsernameAsync(username, cancellationToken);
        if (existingUser is not null)
        {
            throw new DomainException("Username is already taken.");
        }

        return await (transactionRunner ?? PassthroughTransactionRunner.Instance)
            .ExecuteAsync(async transactionCancellationToken =>
            {
                var (succeeded, errors, userId) = await identityService.RegisterUserAsync(
                    username,
                    displayName,
                    request.Password,
                    transactionCancellationToken);
                if (!succeeded)
                {
                    throw new DomainException(string.Join(", ", errors));
                }

                var user = await userRepo.CreateAsync(
                    userId,
                    username,
                    displayName,
                    transactionCancellationToken);
                var (accessToken, refreshToken) = await identityService.GenerateTokensAsync(
                    user.Id,
                    user.Username,
                    transactionCancellationToken);

                return new LoginResponse(
                    AccessToken: accessToken,
                    RefreshToken: refreshToken,
                    User: user);
            }, cancellationToken);
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var (succeeded, accessToken, refreshToken, userId, username) =
            await identityService.RefreshTokenAsync(request.RefreshToken, cancellationToken);

        if (!succeeded)
        {
            throw new AuthenticationException("Invalid or expired refresh token.");
        }

        var user = await userRepo.GetByIdAsync(userId, cancellationToken)
            ?? await userRepo.GetByUsernameAsync(username, cancellationToken)
            ?? new UserDto(userId, username, username, "online");

        return new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            User: user);
    }

    public Task LogoutAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default) =>
        identityService.RevokeTokenAsync(request.RefreshToken, cancellationToken);

    private sealed class PassthroughTransactionRunner : ITransactionRunner
    {
        public static PassthroughTransactionRunner Instance { get; } = new();

        public Task<T> ExecuteAsync<T>(
            Func<CancellationToken, Task<T>> action,
            CancellationToken cancellationToken) =>
            action(cancellationToken);
    }
}
