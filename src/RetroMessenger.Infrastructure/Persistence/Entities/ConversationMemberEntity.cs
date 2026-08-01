namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class ConversationMemberEntity
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public short Role { get; set; } = 1;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
    public long LastReadSequence { get; set; }

    public ConversationEntity? Conversation { get; set; }
    public UserProfileEntity? User { get; set; }
}
