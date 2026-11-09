using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Contracts.Messaging;

public sealed record SendMessageRequest(string ClientMessageId, string Content);

public sealed record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid SenderId,
    string ClientMessageId,
    long Sequence,
    MessageType Type,
    string Content,
    DateTimeOffset CreatedAt,
    DateTimeOffset? EditedAt,
    DateTimeOffset? DeletedAt);

public sealed record SendMessageResponse(MessageDto Message, bool IsDuplicate);

public sealed record CreateDirectConversationRequest(Guid TargetUserId);

public sealed record CreateGroupConversationRequest(string Title, IReadOnlyCollection<Guid> MemberIds);

public sealed record ConversationDto(
    Guid Id,
    string Title,
    long LastSequence,
    IReadOnlyCollection<Guid> MemberIds);
