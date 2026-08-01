namespace RetroMessenger.Contracts.Contacts;

public sealed record FriendDto(
    Guid UserId,
    string Username,
    string DisplayName,
    string Status,
    string? GroupName = "Bạn bè");

public sealed record FriendRequestDto(
    Guid RequestId,
    Guid SenderId,
    string SenderDisplayName,
    DateTimeOffset CreatedAt,
    Guid? RecipientId = null,
    string? RecipientDisplayName = null,
    string Direction = "incoming");

public sealed record ContactRequestStateDto(
    IReadOnlyCollection<FriendRequestDto> Incoming,
    IReadOnlyCollection<FriendRequestDto> Outgoing);

public sealed record BlockedContactDto(
    Guid UserId,
    string Username,
    string DisplayName,
    DateTimeOffset BlockedAt);

public sealed record SendFriendRequest(string TargetUsername);

public sealed record BlockContactRequest(Guid UserId);

public sealed record RespondFriendRequest(bool Accept);
