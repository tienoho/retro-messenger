namespace RetroMessenger.Contracts.Users;

public sealed record UserDto(
    Guid Id,
    string Username,
    string DisplayName,
    string Status,
    string? CustomStatus = null);

public sealed record UpdateProfileRequest(string DisplayName, string? CustomStatus);

public sealed record UpdateStatusRequest(string Status);
