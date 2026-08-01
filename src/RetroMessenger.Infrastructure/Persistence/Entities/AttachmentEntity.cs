namespace RetroMessenger.Infrastructure.Persistence.Entities;

public sealed class AttachmentEntity
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid UploaderId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // pending, ready, quarantined
    public string? ThumbnailKey { get; set; }
    public string? QuarantineReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ScannedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? ProcessingOwner { get; set; }
    public DateTimeOffset? ProcessingLeaseUntil { get; set; }
    public int ProcessingAttempts { get; set; }
    public DateTimeOffset? NextProcessingAt { get; set; } = DateTimeOffset.UtcNow;
    public string? LastProcessingError { get; set; }
    public Guid? CleanupOwner { get; set; }
    public DateTimeOffset? CleanupLeaseUntil { get; set; }
    public DateTimeOffset? StorageDeletedAt { get; set; }
    public string? LastCleanupError { get; set; }

    public ConversationEntity? Conversation { get; set; }
    public UserProfileEntity? Uploader { get; set; }
}
