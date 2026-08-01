namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class ContactEntity
{
    public Guid UserId { get; set; }
    public Guid ContactId { get; set; }
    public string Status { get; set; } = "accepted";
    public string GroupName { get; set; } = "Bạn bè";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
