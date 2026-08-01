namespace RetroMessenger.Domain.Users;

public sealed record User(Guid Id, string DisplayName, string Status);
