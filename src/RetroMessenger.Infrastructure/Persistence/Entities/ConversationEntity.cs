namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class ConversationEntity
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public short ConversationType { get; set; } = 1;
    public long LastSequence { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ConversationMemberEntity> Members { get; set; } = new List<ConversationMemberEntity>();
}
