using RetroMessenger.Domain.Media;

namespace RetroMessenger.Application.Abstractions;

public interface IAttachmentRepository
{
    Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default);
    Task<Attachment?> GetByIdAsync(Guid attachmentId, CancellationToken cancellationToken = default);
    Task<Attachment?> GetByObjectKeyAsync(string objectKey, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(
        Guid attachmentId,
        string status,
        string? quarantineReason = null,
        string? thumbnailKey = null,
        DateTimeOffset? scannedAt = null,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Attachment>> GetPendingAttachmentsAsync(int limit, CancellationToken cancellationToken = default);
}
