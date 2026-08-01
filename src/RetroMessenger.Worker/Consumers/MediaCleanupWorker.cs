using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Worker.Consumers;

public sealed class MediaCleanupOptions
{
    public const string SectionName = "MediaCleanup";

    public int BatchSize { get; set; } = 20;
    public int IntervalSeconds { get; set; } = 60;
    public int LeaseSeconds { get; set; } = 300;
    public int UploadTimeoutHours { get; set; } = 24;
    public int TerminalRetentionDays { get; set; } = 7;
    public int FailureRetrySeconds { get; set; } = 60;
}

#pragma warning disable CA1848
#pragma warning disable CA1873
public sealed class MediaCleanupWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<MediaCleanupOptions> options,
    ILogger<MediaCleanupWorker> logger) : BackgroundService
{
    private readonly MediaCleanupOptions _options = options.Value;
    private readonly Guid _workerId = Guid.NewGuid();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessCleanupBatchAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Media lifecycle cleanup failed.");
            }

            await Task.Delay(
                TimeSpan.FromSeconds(Math.Max(5, _options.IntervalSeconds)),
                stoppingToken);
        }
    }

    public async Task ProcessCleanupBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetService<MessengerDbContext>();
        var storage = scope.ServiceProvider.GetService<IStorageService>();
        if (db is null || storage is null)
        {
            return;
        }

        var attachments = await ClaimCleanupBatchAsync(db, cancellationToken);
        foreach (var attachment in attachments)
        {
            try
            {
                await storage.DeleteObjectAsync(attachment.ObjectKey, cancellationToken);
                if (!string.IsNullOrWhiteSpace(attachment.ThumbnailKey))
                {
                    await storage.DeleteObjectAsync(attachment.ThumbnailKey, cancellationToken);
                }

                await CompleteCleanupAsync(db, attachment, cancellationToken);
                logger.LogInformation(
                    "Deleted retained media objects for attachment {AttachmentId}.",
                    attachment.Id);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                await ReleaseCleanupClaimAsync(db, attachment.Id, exception, cancellationToken);
                logger.LogError(
                    exception,
                    "Failed to clean media objects for attachment {AttachmentId}.",
                    attachment.Id);
            }
        }
    }

    private async Task<IReadOnlyList<AttachmentEntity>> ClaimCleanupBatchAsync(
        MessengerDbContext db,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var uploadCutoff = now.AddHours(-Math.Max(1, _options.UploadTimeoutHours));
        var terminalCutoff = now.AddDays(-Math.Max(1, _options.TerminalRetentionDays));
        var leaseUntil = now.AddSeconds(Math.Max(30, _options.LeaseSeconds));
        var batchSize = Math.Clamp(_options.BatchSize, 1, 100);

        return await db.Attachments
            .FromSqlInterpolated($$"""
                WITH candidates AS (
                    SELECT id
                    FROM media.attachments
                    WHERE storage_deleted_at IS NULL
                      AND (
                            cleanup_lease_until IS NULL
                            OR cleanup_lease_until <= {{now}}
                      )
                      AND (
                            (status = 'uploading' AND updated_at <= {{uploadCutoff}})
                            OR (
                                status IN ('failed', 'quarantined')
                                AND updated_at <= {{terminalCutoff}}
                            )
                      )
                    ORDER BY updated_at, created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT {{batchSize}}
                )
                UPDATE media.attachments AS attachment
                SET cleanup_owner = {{_workerId}},
                    cleanup_lease_until = {{leaseUntil}},
                    last_cleanup_error = NULL
                FROM candidates
                WHERE attachment.id = candidates.id
                RETURNING attachment.*
                """)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    private async Task CompleteCleanupAsync(
        MessengerDbContext db,
        AttachmentEntity attachment,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var status = attachment.Status == "uploading" ? "failed" : attachment.Status;
        var uploadExpiredReason = attachment.Status == "uploading"
            ? "Upload expired before completion."
            : attachment.LastProcessingError;

        await OwnedClaim(db, attachment.Id)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.Status, status)
                    .SetProperty(x => x.StorageDeletedAt, now)
                    .SetProperty(x => x.UpdatedAt, now)
                    .SetProperty(x => x.LastProcessingError, uploadExpiredReason)
                    .SetProperty(x => x.CleanupOwner, (Guid?)null)
                    .SetProperty(x => x.CleanupLeaseUntil, (DateTimeOffset?)null)
                    .SetProperty(x => x.LastCleanupError, (string?)null),
                cancellationToken);
    }

    private async Task ReleaseCleanupClaimAsync(
        MessengerDbContext db,
        Guid attachmentId,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var retryAt = DateTimeOffset.UtcNow.AddSeconds(
            Math.Max(5, _options.FailureRetrySeconds));
        var error = exception.Message.Length <= 2000
            ? exception.Message
            : exception.Message[..2000];

        await OwnedClaim(db, attachmentId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.CleanupOwner, (Guid?)null)
                    .SetProperty(x => x.CleanupLeaseUntil, retryAt)
                    .SetProperty(x => x.LastCleanupError, error),
                cancellationToken);
    }

    private IQueryable<AttachmentEntity> OwnedClaim(
        MessengerDbContext db,
        Guid attachmentId) =>
        db.Attachments.Where(x =>
            x.Id == attachmentId &&
            x.CleanupOwner == _workerId);
}
