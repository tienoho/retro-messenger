using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Domain.Media;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresAttachmentRepository(MessengerDbContext db) : IAttachmentRepository
{
    public async Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default)
    {
        var entity = MapToEntity(attachment);
        db.Attachments.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Attachment?> GetByIdAsync(Guid attachmentId, CancellationToken cancellationToken = default)
    {
        var entity = await db.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId, cancellationToken);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task<Attachment?> GetByObjectKeyAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var entity = await db.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ObjectKey == objectKey, cancellationToken);

        return entity is null ? null : MapToDomain(entity);
    }

    public async Task UpdateStatusAsync(
        Guid attachmentId,
        string status,
        string? quarantineReason = null,
        string? thumbnailKey = null,
        DateTimeOffset? scannedAt = null,
        CancellationToken cancellationToken = default)
    {
        var entity = await db.Attachments.FirstOrDefaultAsync(a => a.Id == attachmentId, cancellationToken);
        if (entity is null)
        {
            return;
        }

        entity.Status = status;
        if (quarantineReason is not null)
        {
            entity.QuarantineReason = quarantineReason;
        }
        if (thumbnailKey is not null)
        {
            entity.ThumbnailKey = thumbnailKey;
        }
        if (scannedAt.HasValue)
        {
            entity.ScannedAt = scannedAt.Value;
        }
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Attachment>> GetPendingAttachmentsAsync(int limit, CancellationToken cancellationToken = default)
    {
        var entities = await db.Attachments
            .AsNoTracking()
            .Where(a => a.Status == "pending")
            .OrderBy(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return entities.Select(MapToDomain).ToList();
    }

    private static AttachmentEntity MapToEntity(Attachment domain)
    {
        return new AttachmentEntity
        {
            Id = domain.Id,
            ConversationId = domain.ConversationId,
            UploaderId = domain.UploaderId,
            FileName = domain.FileName,
            ContentType = domain.ContentType,
            FileSizeBytes = domain.FileSizeBytes,
            ObjectKey = domain.ObjectKey,
            Status = domain.Status,
            ThumbnailKey = domain.ThumbnailKey,
            QuarantineReason = domain.QuarantineReason,
            CreatedAt = domain.CreatedAt,
            ScannedAt = domain.ScannedAt,
            UpdatedAt = domain.UpdatedAt
        };
    }

    private static Attachment MapToDomain(AttachmentEntity entity)
    {
        return new Attachment(
            entity.Id,
            entity.ConversationId,
            entity.UploaderId,
            entity.FileName,
            entity.ContentType,
            entity.FileSizeBytes,
            entity.ObjectKey,
            entity.Status,
            entity.ThumbnailKey,
            entity.QuarantineReason,
            entity.CreatedAt,
            entity.ScannedAt,
            entity.UpdatedAt
        );
    }
}
