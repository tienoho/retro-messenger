namespace RetroMessenger.Domain.Media;

using RetroMessenger.Domain.Common;

public sealed class Attachment
{
    public Attachment(
        Guid id,
        Guid conversationId,
        Guid uploaderId,
        string fileName,
        string contentType,
        long fileSizeBytes,
        string objectKey,
        string status = "pending",
        string? thumbnailKey = null,
        string? quarantineReason = null,
        DateTimeOffset? createdAt = null,
        DateTimeOffset? scannedAt = null,
        DateTimeOffset? updatedAt = null)
    {
        if (id == Guid.Empty || conversationId == Guid.Empty || uploaderId == Guid.Empty)
        {
            throw new DomainException("Attachment identifiers are required.");
        }

        if (string.IsNullOrWhiteSpace(fileName) ||
            fileName.Length > 255 ||
            !string.Equals(fileName, Path.GetFileName(fileName), StringComparison.Ordinal))
        {
            throw new DomainException("Attachment file name is invalid.");
        }

        if (string.IsNullOrWhiteSpace(contentType) || contentType.Length > 100)
        {
            throw new DomainException("Attachment content type is invalid.");
        }

        if (fileSizeBytes is <= 0 or > 26_214_400)
        {
            throw new DomainException("Attachment size must be between 1 byte and 25 MB.");
        }

        if (string.IsNullOrWhiteSpace(objectKey) || objectKey.Contains("..", StringComparison.Ordinal))
        {
            throw new DomainException("Attachment object key is invalid.");
        }

        if (status is not ("uploading" or "pending" or "processing" or "ready" or "quarantined" or "failed"))
        {
            throw new DomainException("Attachment status is invalid.");
        }

        Id = id;
        ConversationId = conversationId;
        UploaderId = uploaderId;
        FileName = fileName;
        ContentType = contentType;
        FileSizeBytes = fileSizeBytes;
        ObjectKey = objectKey;
        Status = status;
        ThumbnailKey = thumbnailKey;
        QuarantineReason = quarantineReason;
        CreatedAt = createdAt ?? DateTimeOffset.UtcNow;
        ScannedAt = scannedAt;
        UpdatedAt = updatedAt ?? DateTimeOffset.UtcNow;
    }

    public Guid Id { get; }
    public Guid ConversationId { get; }
    public Guid UploaderId { get; }
    public string FileName { get; }
    public string ContentType { get; }
    public long FileSizeBytes { get; }
    public string ObjectKey { get; }
    public string Status { get; private set; }
    public string? ThumbnailKey { get; private set; }
    public string? QuarantineReason { get; private set; }
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset? ScannedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public void MarkReady(DateTimeOffset scannedAt, string? thumbnailKey = null)
    {
        Status = "ready";
        ScannedAt = scannedAt;
        if (thumbnailKey is not null)
        {
            ThumbnailKey = thumbnailKey;
        }
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void MarkQuarantined(string reason, DateTimeOffset scannedAt)
    {
        Status = "quarantined";
        QuarantineReason = reason;
        ScannedAt = scannedAt;
        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
