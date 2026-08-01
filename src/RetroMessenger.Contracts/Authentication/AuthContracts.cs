using RetroMessenger.Contracts.Users;

namespace RetroMessenger.Contracts.Authentication;

public sealed record LoginRequest(string Username, string Password);

public sealed record RegisterRequest(string Username, string DisplayName, string Password);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record LoginResponse(string AccessToken, string RefreshToken, UserDto User);
