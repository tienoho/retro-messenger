using System.Collections.Concurrent;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;
using RetroMessenger.Infrastructure.Storage;
using RetroMessenger.Worker.Consumers;
using Xunit;

namespace RetroMessenger.IntegrationTests;

[Collection("PostgresAndRedis")]
public sealed class MediaWorkerConcurrencyIntegrationTests(PostgresAndRedisFixture fixture)
{
    [Fact]
    public async Task ConcurrentWorkersClaimEachAttachmentOnce()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner(delayMilliseconds: 75);
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var attachmentIds = new List<Guid>();

        await using (var db = fixture.CreateDbContext())
        {
            for (var index = 0; index < 12; index++)
            {
                var id = Guid.CreateVersion7();
                var fileName = $"concurrent-{id:N}.txt";
                var objectKey = $"attachments/{conversationId:N}/{id:N}.txt";
                var bytes = Encoding.UTF8.GetBytes($"message {index}");
                attachmentIds.Add(id);
                db.Attachments.Add(CreateAttachment(
                    id,
                    conversationId,
                    uploaderId,
                    fileName,
                    "text/plain",
                    bytes.Length,
                    objectKey,
                    "pending",
                    DateTimeOffset.UtcNow));
                await storage.UploadBytesAsync(objectKey, bytes, "text/plain");
            }

            await db.SaveChangesAsync();
        }

        await using var provider = CreateWorkerProvider(storage, scanner);
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var workerOptions = Options.Create(new MediaProcessingOptions
        {
            BatchSize = 6,
            LeaseSeconds = 60,
            MaxAttempts = 3
        });
        var firstWorker = new MediaProcessingWorker(
            scopeFactory,
            workerOptions,
            NullLogger<MediaProcessingWorker>.Instance);
        var secondWorker = new MediaProcessingWorker(
            scopeFactory,
            workerOptions,
            NullLogger<MediaProcessingWorker>.Instance);

        await Task.WhenAll(
            firstWorker.ProcessPendingAttachmentsAsync(CancellationToken.None),
            secondWorker.ProcessPendingAttachmentsAsync(CancellationToken.None));

        await using var verification = fixture.CreateDbContext();
        var rows = await verification.Attachments
            .AsNoTracking()
            .Where(x => attachmentIds.Contains(x.Id))
            .ToListAsync();
        Assert.Equal(12, rows.Count);
        Assert.All(rows, row =>
        {
            Assert.Equal("ready", row.Status);
            Assert.Equal(1, row.ProcessingAttempts);
            Assert.Null(row.ProcessingOwner);
            Assert.Equal(1, scanner.GetScanCount(row.FileName));
        });
    }

    [Fact]
    public async Task ContentTypeMismatchFailsAndDeletesObjectBeforeScanning()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner();
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var attachmentId = Guid.CreateVersion7();
        var objectKey = $"attachments/{conversationId:N}/{attachmentId:N}.png";
        var bytes = "plain text disguised as png"u8.ToArray();

        await using (var db = fixture.CreateDbContext())
        {
            db.Attachments.Add(CreateAttachment(
                attachmentId,
                conversationId,
                uploaderId,
                "disguised.png",
                "image/png",
                bytes.Length,
                objectKey,
                "pending",
                DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
        }
        await storage.UploadBytesAsync(objectKey, bytes, "image/png");

        await using var provider = CreateWorkerProvider(storage, scanner);
        var worker = new MediaProcessingWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new MediaProcessingOptions()),
            NullLogger<MediaProcessingWorker>.Instance);

        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);

        await using var verification = fixture.CreateDbContext();
        var row = await verification.Attachments.AsNoTracking().SingleAsync(x => x.Id == attachmentId);
        Assert.Equal("failed", row.Status);
        Assert.NotNull(row.StorageDeletedAt);
        Assert.Contains("text/plain", row.LastProcessingError, StringComparison.Ordinal);
        Assert.Equal(0, scanner.GetScanCount("disguised.png"));
        Assert.Equal(1, storage.GetDeleteCount(objectKey));
    }

    [Fact]
    public async Task ProcessingFailureUsesBoundedAttemptsAndClearsLease()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner(throwOnScan: true);
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var attachmentId = Guid.CreateVersion7();
        var objectKey = $"attachments/{conversationId:N}/{attachmentId:N}.txt";
        var bytes = "retry me"u8.ToArray();

        await using (var db = fixture.CreateDbContext())
        {
            db.Attachments.Add(CreateAttachment(
                attachmentId,
                conversationId,
                uploaderId,
                "retry.txt",
                "text/plain",
                bytes.Length,
                objectKey,
                "pending",
                DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
        }
        await storage.UploadBytesAsync(objectKey, bytes, "text/plain");

        await using var provider = CreateWorkerProvider(storage, scanner);
        var worker = new MediaProcessingWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new MediaProcessingOptions { MaxAttempts = 1 }),
            NullLogger<MediaProcessingWorker>.Instance);

        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);

        await using var verification = fixture.CreateDbContext();
        var row = await verification.Attachments.AsNoTracking().SingleAsync(x => x.Id == attachmentId);
        Assert.Equal("failed", row.Status);
        Assert.Equal(1, row.ProcessingAttempts);
        Assert.Null(row.ProcessingOwner);
        Assert.Null(row.ProcessingLeaseUntil);
        Assert.Contains("scanner unavailable", row.LastProcessingError, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ProcessingFailureSchedulesBackoffBeforeNextClaim()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner(throwOnScan: true);
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var attachmentId = Guid.CreateVersion7();
        var objectKey = $"attachments/{conversationId:N}/{attachmentId:N}.txt";
        var bytes = "backoff"u8.ToArray();

        await using (var db = fixture.CreateDbContext())
        {
            db.Attachments.Add(CreateAttachment(
                attachmentId, conversationId, uploaderId, "backoff.txt", "text/plain",
                bytes.Length, objectKey, "pending", DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
        }
        await storage.UploadBytesAsync(objectKey, bytes, "text/plain");

        await using var provider = CreateWorkerProvider(storage, scanner);
        var worker = new MediaProcessingWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new MediaProcessingOptions
            {
                MaxAttempts = 2,
                InitialRetryDelaySeconds = 60
            }),
            NullLogger<MediaProcessingWorker>.Instance);

        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);
        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);

        await using var verification = fixture.CreateDbContext();
        var row = await verification.Attachments.AsNoTracking().SingleAsync(x => x.Id == attachmentId);
        Assert.Equal("pending", row.Status);
        Assert.Equal(1, row.ProcessingAttempts);
        Assert.True(row.NextProcessingAt > DateTimeOffset.UtcNow.AddSeconds(30));
        Assert.Equal(1, scanner.GetScanCount("backoff.txt"));
    }

    [Fact]
    public async Task ExpiredProcessingLeaseCanBeRecoveredByAnotherWorker()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner();
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var attachmentId = Guid.CreateVersion7();
        var objectKey = $"attachments/{conversationId:N}/{attachmentId:N}.txt";
        var bytes = "lease recovery"u8.ToArray();

        await using (var db = fixture.CreateDbContext())
        {
            var attachment = CreateAttachment(
                attachmentId, conversationId, uploaderId, "lease.txt", "text/plain",
                bytes.Length, objectKey, "processing", DateTimeOffset.UtcNow.AddMinutes(-10));
            attachment.ProcessingOwner = Guid.NewGuid();
            attachment.ProcessingLeaseUntil = DateTimeOffset.UtcNow.AddMinutes(-1);
            attachment.ProcessingAttempts = 2;
            db.Attachments.Add(attachment);
            await db.SaveChangesAsync();
        }
        await storage.UploadBytesAsync(objectKey, bytes, "text/plain");

        await using var provider = CreateWorkerProvider(storage, scanner);
        var worker = new MediaProcessingWorker(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new MediaProcessingOptions()),
            NullLogger<MediaProcessingWorker>.Instance);

        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);

        await using var verification = fixture.CreateDbContext();
        var row = await verification.Attachments.AsNoTracking().SingleAsync(x => x.Id == attachmentId);
        Assert.Equal("ready", row.Status);
        Assert.Equal(3, row.ProcessingAttempts);
        Assert.Null(row.ProcessingOwner);
        Assert.Null(row.ProcessingLeaseUntil);
        Assert.Equal(1, scanner.GetScanCount("lease.txt"));
    }

    [Fact]
    public async Task ConcurrentCleanupWorkersDeleteOnlyExpiredTerminalObjects()
    {
        Assert.True(fixture.IsUsingRealContainers);
        var storage = new ConcurrentStorageService();
        var scanner = new CountingScanner();
        var (conversationId, uploaderId) = await CreateMediaOwnerAsync();
        var now = DateTimeOffset.UtcNow;
        var staleUpload = CreateAttachment(
            Guid.CreateVersion7(), conversationId, uploaderId, "stale.txt", "text/plain", 5,
            $"attachments/{conversationId:N}/stale.txt", "uploading", now.AddHours(-25));
        var oldQuarantine = CreateAttachment(
            Guid.CreateVersion7(), conversationId, uploaderId, "old.txt", "text/plain", 5,
            $"attachments/{conversationId:N}/old.txt", "quarantined", now.AddDays(-8));
        oldQuarantine.ThumbnailKey = $"thumbnails/{conversationId}/{oldQuarantine.Id}.png";
        var recentFailure = CreateAttachment(
            Guid.CreateVersion7(), conversationId, uploaderId, "recent.txt", "text/plain", 5,
            $"attachments/{conversationId:N}/recent.txt", "failed", now.AddDays(-1));
        var ready = CreateAttachment(
            Guid.CreateVersion7(), conversationId, uploaderId, "ready.txt", "text/plain", 5,
            $"attachments/{conversationId:N}/ready.txt", "ready", now.AddDays(-30));

        await using (var db = fixture.CreateDbContext())
        {
            db.Attachments.AddRange(staleUpload, oldQuarantine, recentFailure, ready);
            await db.SaveChangesAsync();
        }
        foreach (var attachment in new[] { staleUpload, oldQuarantine, recentFailure, ready })
        {
            await storage.UploadBytesAsync(attachment.ObjectKey, "value"u8.ToArray(), attachment.ContentType);
        }
        await storage.UploadBytesAsync(oldQuarantine.ThumbnailKey, [1, 2, 3], "image/png");

        await using var provider = CreateWorkerProvider(storage, scanner);
        var cleanupOptions = Options.Create(new MediaCleanupOptions
        {
            UploadTimeoutHours = 24,
            TerminalRetentionDays = 7,
            BatchSize = 10
        });
        var scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();
        var firstWorker = new MediaCleanupWorker(
            scopeFactory,
            cleanupOptions,
            NullLogger<MediaCleanupWorker>.Instance);
        var secondWorker = new MediaCleanupWorker(
            scopeFactory,
            cleanupOptions,
            NullLogger<MediaCleanupWorker>.Instance);

        await Task.WhenAll(
            firstWorker.ProcessCleanupBatchAsync(CancellationToken.None),
            secondWorker.ProcessCleanupBatchAsync(CancellationToken.None));

        await using var verification = fixture.CreateDbContext();
        var rows = await verification.Attachments
            .AsNoTracking()
            .Where(x => x.Id == staleUpload.Id || x.Id == oldQuarantine.Id ||
                        x.Id == recentFailure.Id || x.Id == ready.Id)
            .ToDictionaryAsync(x => x.Id);
        Assert.Equal("failed", rows[staleUpload.Id].Status);
        Assert.NotNull(rows[staleUpload.Id].StorageDeletedAt);
        Assert.NotNull(rows[oldQuarantine.Id].StorageDeletedAt);
        Assert.Null(rows[recentFailure.Id].StorageDeletedAt);
        Assert.Null(rows[ready.Id].StorageDeletedAt);
        Assert.Equal(1, storage.GetDeleteCount(staleUpload.ObjectKey));
        Assert.Equal(1, storage.GetDeleteCount(oldQuarantine.ObjectKey));
        Assert.Equal(1, storage.GetDeleteCount(oldQuarantine.ThumbnailKey));
        Assert.Equal(0, storage.GetDeleteCount(recentFailure.ObjectKey));
        Assert.Equal(0, storage.GetDeleteCount(ready.ObjectKey));
    }

    private async Task<(Guid ConversationId, Guid UploaderId)> CreateMediaOwnerAsync()
    {
        await using var db = fixture.CreateDbContext();
        var conversationId = Guid.NewGuid();
        var uploaderId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, uploaderId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = conversationId,
            Title = "Media worker test",
            LastSequence = 0
        });
        await db.SaveChangesAsync();
        return (conversationId, uploaderId);
    }

    private ServiceProvider CreateWorkerProvider(
        ConcurrentStorageService storage,
        CountingScanner scanner)
    {
        var services = new ServiceCollection();
        services.AddDbContext<MessengerDbContext>(options =>
            options.UseNpgsql(fixture.PostgresConnectionString));
        services.AddSingleton<IStorageService>(storage);
        services.AddSingleton<IClamAvScanner>(scanner);
        services.AddSingleton<IThumbnailGenerator, NoOpThumbnailGenerator>();
        services.AddSingleton<IContentTypeDetector, ContentTypeDetector>();
        return services.BuildServiceProvider();
    }

    private static AttachmentEntity CreateAttachment(
        Guid id,
        Guid conversationId,
        Guid uploaderId,
        string fileName,
        string contentType,
        long length,
        string objectKey,
        string status,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = id,
            ConversationId = conversationId,
            UploaderId = uploaderId,
            FileName = fileName,
            ContentType = contentType,
            FileSizeBytes = length,
            ObjectKey = objectKey,
            Status = status,
            CreatedAt = updatedAt,
            UpdatedAt = updatedAt,
            NextProcessingAt = updatedAt
        };

    private sealed class CountingScanner(
        int delayMilliseconds = 0,
        bool throwOnScan = false) : IClamAvScanner
    {
        private readonly ConcurrentDictionary<string, int> _counts = new(StringComparer.Ordinal);

        public int GetScanCount(string fileName) =>
            _counts.TryGetValue(fileName, out var count) ? count : 0;

        public async Task<VirusScanResult> ScanAsync(
            Stream content,
            string fileName,
            CancellationToken cancellationToken = default)
        {
            _counts.AddOrUpdate(fileName, 1, (_, current) => current + 1);
            if (delayMilliseconds > 0)
            {
                await Task.Delay(delayMilliseconds, cancellationToken);
            }

            if (throwOnScan)
            {
                throw new InvalidOperationException("scanner unavailable");
            }

            await content.CopyToAsync(Stream.Null, cancellationToken);
            return new VirusScanResult(true);
        }
    }

    private sealed class NoOpThumbnailGenerator : IThumbnailGenerator
    {
        public Task<ThumbnailResult> GenerateThumbnailAsync(
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ThumbnailResult(false, null, null));
    }

    private sealed class ConcurrentStorageService : IStorageService
    {
        private readonly ConcurrentDictionary<string, StoredObject> _objects = new(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, int> _deleteCounts = new(StringComparer.Ordinal);

        public int GetDeleteCount(string objectKey) =>
            _deleteCounts.TryGetValue(objectKey, out var count) ? count : 0;

        public Task<string> GeneratePresignedUploadUrlAsync(
            string objectKey,
            string contentType,
            TimeSpan expiry,
            CancellationToken cancellationToken = default) =>
            Task.FromResult($"https://storage.test/{objectKey}");

        public Task<string> GeneratePresignedDownloadUrlAsync(
            string objectKey,
            string fileName,
            TimeSpan expiry,
            CancellationToken cancellationToken = default) =>
            Task.FromResult($"https://storage.test/{objectKey}");

        public async Task UploadObjectAsync(
            string objectKey,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            using var output = new MemoryStream();
            await content.CopyToAsync(output, cancellationToken);
            _objects[objectKey] = new StoredObject(output.ToArray(), contentType);
        }

        public Task<Stream?> GetObjectAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            Stream? stream = _objects.TryGetValue(objectKey, out var value)
                ? new MemoryStream(value.Bytes, writable: false)
                : null;
            return Task.FromResult(stream);
        }

        public Task<StoredObjectMetadata?> GetObjectMetadataAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            StoredObjectMetadata? metadata = _objects.TryGetValue(objectKey, out var value)
                ? new StoredObjectMetadata(value.Bytes.LongLength, value.ContentType)
                : null;
            return Task.FromResult(metadata);
        }

        public Task DeleteObjectAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            _deleteCounts.AddOrUpdate(objectKey, 1, (_, current) => current + 1);
            _objects.TryRemove(objectKey, out _);
            return Task.CompletedTask;
        }

        public Task UploadBytesAsync(string objectKey, byte[] bytes, string contentType) =>
            UploadObjectAsync(objectKey, new MemoryStream(bytes, writable: false), contentType);

        private sealed record StoredObject(byte[] Bytes, string ContentType);
    }
}
