namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class OutboxMessageEntity
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = "{}";
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? Error { get; set; }
    public int RetryCount { get; set; }
    public bool IsQuarantined { get; set; }
    public DateTimeOffset? QuarantinedAt { get; set; }
}
