namespace RetroMessenger.Contracts.Admin;

public sealed record AdminOverviewDto(
    int UserCount,
    int ConversationCount,
    int PendingOutboxCount,
    int ActiveRefreshSessionCount);

public sealed record AdminUserDto(
    Guid Id,
    string Username,
    string DisplayName,
    string Status,
    bool Suspended,
    DateTimeOffset CreatedAt);

public sealed record SetUserSuspensionRequest(bool Suspended, string Reason);

public sealed record AdminAuditLogDto(
    Guid Id,
    Guid ActorId,
    string ActorUsername,
    string Action,
    string TargetType,
    Guid TargetId,
    string Reason,
    DateTimeOffset OccurredAt);
