using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Worker.Consumers;

public sealed class MediaProcessingOptions
{
    public const string SectionName = "MediaProcessing";

    public int BatchSize { get; set; } = 10;
    public int PollIntervalMilliseconds { get; set; } = 500;
    public int LeaseSeconds { get; set; } = 300;
    public int MaxAttempts { get; set; } = 5;
    public int InitialRetryDelaySeconds { get; set; } = 5;
    public int MaxRetryDelaySeconds { get; set; } = 300;
}

#pragma warning disable CA1848
#pragma warning disable CA1873
public sealed class MediaProcessingWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<MediaProcessingOptions> options,
    ILogger<MediaProcessingWorker> logger) : BackgroundService
{
    private readonly MediaProcessingOptions _options = options.Value;
    private readonly Guid _workerId = Guid.NewGuid();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingAttachmentsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing pending media attachments.");
            }

            await Task.Delay(
                TimeSpan.FromMilliseconds(Math.Max(100, _options.PollIntervalMilliseconds)),
                stoppingToken);
        }
    }

    public async Task ProcessPendingAttachmentsAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetService<MessengerDbContext>();
        var scanner = scope.ServiceProvider.GetService<IClamAvScanner>();
        var thumbnailGenerator = scope.ServiceProvider.GetService<IThumbnailGenerator>();
        var contentTypeDetector = scope.ServiceProvider.GetService<IContentTypeDetector>();
        var storage = scope.ServiceProvider.GetService<IStorageService>();

        if (db is null || scanner is null || thumbnailGenerator is null ||
            contentTypeDetector is null || storage is null)
        {
            return;
        }

        var attachments = await ClaimAttachmentsAsync(db, cancellationToken);
        foreach (var attachment in attachments)
        {
            try
            {
                await ProcessAttachmentAsync(
                    db,
                    attachment,
                    scanner,
                    thumbnailGenerator,
                    contentTypeDetector,
                    storage,
                    cancellationToken);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "Failed to process attachment {Id}", attachment.Id);
                await ReleaseOrFailClaimAsync(db, attachment, exception, cancellationToken);
            }
        }
    }

    private async Task<IReadOnlyList<AttachmentEntity>> ClaimAttachmentsAsync(
        MessengerDbContext db,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var leaseUntil = now.AddSeconds(Math.Max(30, _options.LeaseSeconds));
        var batchSize = Math.Clamp(_options.BatchSize, 1, 100);

        return await db.Attachments
            .FromSqlInterpolated($$"""
                WITH candidates AS (
                    SELECT id
                    FROM media.attachments
                    WHERE (
                            status = 'pending'
                            AND COALESCE(next_processing_at, created_at) <= {{now}}
                        )
                        OR (
                            status = 'processing'
                            AND (
                                processing_lease_until IS NULL
                                OR processing_lease_until <= {{now}}
                            )
                        )
                    ORDER BY created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT {{batchSize}}
                )
                UPDATE media.attachments AS attachment
                SET status = 'processing',
                    processing_owner = {{_workerId}},
                    processing_lease_until = {{leaseUntil}},
                    processing_attempts = attachment.processing_attempts + 1,
                    last_processing_error = NULL,
                    updated_at = {{now}}
                FROM candidates
                WHERE attachment.id = candidates.id
                RETURNING attachment.*
                """)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    private async Task ProcessAttachmentAsync(
        MessengerDbContext db,
        AttachmentEntity attachment,
        IClamAvScanner scanner,
        IThumbnailGenerator thumbnailGenerator,
        IContentTypeDetector contentTypeDetector,
        IStorageService storage,
        CancellationToken cancellationToken)
    {
        await using var detectionStream = await GetRequiredObjectAsync(
            storage,
            attachment,
            cancellationToken);
        var detectedContentType = await contentTypeDetector.DetectAsync(
            detectionStream,
            cancellationToken);

        if (!string.Equals(
                detectedContentType,
                attachment.ContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            var reason = detectedContentType is null
                ? "Uploaded content type could not be verified."
                : $"Uploaded content is {detectedContentType}, not {attachment.ContentType}.";
            var finalized = await FinalizeFailedAsync(
                db,
                attachment.Id,
                reason,
                cancellationToken);
            if (finalized)
            {
                await storage.DeleteObjectAsync(attachment.ObjectKey, cancellationToken);
                await MarkStorageDeletedAsync(db, attachment.Id, cancellationToken);
            }

            logger.LogWarning(
                "Attachment {Id} failed content-type validation: {Reason}",
                attachment.Id,
                reason);
            return;
        }

        await using var scanStream = await GetRequiredObjectAsync(
            storage,
            attachment,
            cancellationToken);
        var scanResult = await scanner.ScanAsync(
            scanStream,
            attachment.FileName,
            cancellationToken);

        if (!scanResult.IsClean)
        {
            var reason = scanResult.VirusName ?? "Virus detected";
            await FinalizeQuarantinedAsync(
                db,
                attachment.Id,
                reason,
                cancellationToken);
            logger.LogWarning(
                "Attachment {Id} ({FileName}) quarantined: {Reason}",
                attachment.Id,
                attachment.FileName,
                reason);
            return;
        }

        string? thumbnailKey = null;
        if (attachment.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
            attachment.ContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            await using var thumbnailStream = await GetRequiredObjectAsync(
                storage,
                attachment,
                cancellationToken);
            var thumbnail = await thumbnailGenerator.GenerateThumbnailAsync(
                thumbnailStream,
                attachment.ContentType,
                cancellationToken);
            if (thumbnail.Success && thumbnail.ImageBytes is not null)
            {
                thumbnailKey = $"thumbnails/{attachment.ConversationId}/{attachment.Id}.png";
                using var output = new MemoryStream(thumbnail.ImageBytes);
                await storage.UploadObjectAsync(
                    thumbnailKey,
                    output,
                    thumbnail.ContentType ?? "image/png",
                    cancellationToken);
            }
        }

        var ready = await FinalizeReadyAsync(
            db,
            attachment.Id,
            thumbnailKey,
            cancellationToken);
        if (ready)
        {
            logger.LogInformation(
                "Attachment {Id} ({FileName}) processed successfully and marked ready.",
                attachment.Id,
                attachment.FileName);
        }
        else
        {
            logger.LogWarning(
                "Attachment {Id} completed after its processing lease was lost; state was not overwritten.",
                attachment.Id);
        }
    }

    private static async Task<Stream> GetRequiredObjectAsync(
        IStorageService storage,
        AttachmentEntity attachment,
        CancellationToken cancellationToken) =>
        await storage.GetObjectAsync(attachment.ObjectKey, cancellationToken)
        ?? throw new InvalidOperationException(
            $"Object for attachment {attachment.Id} was not found.");

    private async Task<bool> FinalizeReadyAsync(
        MessengerDbContext db,
        Guid attachmentId,
        string? thumbnailKey,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await OwnedClaim(db, attachmentId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, "ready")
                    .SetProperty(x => x.ThumbnailKey, thumbnailKey)
                    .SetProperty(x => x.ScannedAt, now)
                    .SetProperty(x => x.UpdatedAt, now)
                    .SetProperty(x => x.ProcessingOwner, (Guid?)null)
                    .SetProperty(x => x.ProcessingLeaseUntil, (DateTimeOffset?)null)
                    .SetProperty(x => x.LastProcessingError, (string?)null),
                cancellationToken);
        return affected == 1;
    }

    private async Task<bool> FinalizeQuarantinedAsync(
        MessengerDbContext db,
        Guid attachmentId,
        string reason,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await OwnedClaim(db, attachmentId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, "quarantined")
                    .SetProperty(x => x.QuarantineReason, reason)
                    .SetProperty(x => x.ScannedAt, now)
                    .SetProperty(x => x.UpdatedAt, now)
                    .SetProperty(x => x.ProcessingOwner, (Guid?)null)
                    .SetProperty(x => x.ProcessingLeaseUntil, (DateTimeOffset?)null)
                    .SetProperty(x => x.LastProcessingError, (string?)null),
                cancellationToken);
        return affected == 1;
    }

    private async Task<bool> FinalizeFailedAsync(
        MessengerDbContext db,
        Guid attachmentId,
        string reason,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var affected = await OwnedClaim(db, attachmentId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, "failed")
                    .SetProperty(x => x.UpdatedAt, now)
                    .SetProperty(x => x.ProcessingOwner, (Guid?)null)
                    .SetProperty(x => x.ProcessingLeaseUntil, (DateTimeOffset?)null)
                    .SetProperty(x => x.LastProcessingError, Truncate(reason, 2000)),
                cancellationToken);
        return affected == 1;
    }

    private async Task ReleaseOrFailClaimAsync(
        MessengerDbContext db,
        AttachmentEntity attachment,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var maxAttempts = Math.Max(1, _options.MaxAttempts);
        var terminal = attachment.ProcessingAttempts >= maxAttempts;
        var delaySeconds = CalculateRetryDelaySeconds(attachment.ProcessingAttempts);
        var nextAttempt = now.AddSeconds(delaySeconds);
        var error = Truncate(exception.Message, 2000);

        await OwnedClaim(db, attachment.Id)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, terminal ? "failed" : "pending")
                    .SetProperty(x => x.NextProcessingAt, nextAttempt)
                    .SetProperty(x => x.UpdatedAt, now)
                    .SetProperty(x => x.ProcessingOwner, (Guid?)null)
                    .SetProperty(x => x.ProcessingLeaseUntil, (DateTimeOffset?)null)
                    .SetProperty(x => x.LastProcessingError, error),
                cancellationToken);
    }

    private static async Task MarkStorageDeletedAsync(
        MessengerDbContext db,
        Guid attachmentId,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        await db.Attachments
            .Where(x => x.Id == attachmentId && x.Status == "failed")
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.StorageDeletedAt, now)
                    .SetProperty(x => x.UpdatedAt, now),
                cancellationToken);
    }

    private IQueryable<AttachmentEntity> OwnedClaim(
        MessengerDbContext db,
        Guid attachmentId) =>
        db.Attachments.Where(x =>
            x.Id == attachmentId &&
            x.Status == "processing" &&
            x.ProcessingOwner == _workerId);

    private int CalculateRetryDelaySeconds(int attempt)
    {
        var initial = Math.Max(1, _options.InitialRetryDelaySeconds);
        var maximum = Math.Max(initial, _options.MaxRetryDelaySeconds);
        var exponent = Math.Clamp(attempt - 1, 0, 20);
        var delay = initial * Math.Pow(2, exponent);
        return (int)Math.Min(maximum, delay);
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}
