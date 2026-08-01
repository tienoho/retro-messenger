namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class MessageEntity
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderId { get; set; }
    public string ClientMessageId { get; set; } = string.Empty;
    public long SequenceNo { get; set; }
    public short MessageType { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ConversationEntity? Conversation { get; set; }
    public UserProfileEntity? Sender { get; set; }
}
