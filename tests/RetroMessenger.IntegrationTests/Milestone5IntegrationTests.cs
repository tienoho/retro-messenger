#pragma warning disable CA1707
#pragma warning disable CA1859
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using RetroMessenger.Api.Realtime;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Media;
using RetroMessenger.Contracts.Calls;
using RetroMessenger.Contracts.Media;
using RetroMessenger.Domain.Common;
using RetroMessenger.Infrastructure.Calls;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Contracts.Realtime;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;
using RetroMessenger.Infrastructure.Persistence.Outbox;
using RetroMessenger.Infrastructure.Persistence.Repositories;
using RetroMessenger.Infrastructure.Storage;
using RetroMessenger.Worker.Consumers;
using Xunit;

namespace RetroMessenger.IntegrationTests;

[Collection("PostgresAndRedis")]
public sealed class Milestone5IntegrationTests(PostgresAndRedisFixture fixture)
{
    [Fact]
    public async Task MediaStorageService_UploadLifecycle_EnforcesAuthorizationMetadataAndStatus()
    {
        using var db = fixture.CreateDbContext();
        var storage = new TestStorageService();
        var convRepo = new PostgresConversationRepository(db);
        var attachmentRepo = new PostgresAttachmentRepository(db);
        var service = new MediaStorageService(attachmentRepo, storage, convRepo);

        var convId = Guid.NewGuid();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var userC = Guid.NewGuid(); // non-member

        PostgresAndRedisFixture.AddUserProfiles(db, userA, userB);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Media Test Room", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = userA });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = userB });
        await db.SaveChangesAsync();

        var uploadRequest = new CreatePresignedUrlRequest(convId, "test.png", "image/png", 1024);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.CreateUploadAsync(userC, uploadRequest));

        var upload = await service.CreateUploadAsync(userA, uploadRequest);
        Assert.NotEqual(Guid.Empty, upload.AttachmentId);
        Assert.Contains("X-Amz-Signature", upload.UploadUrl);

        var attachmentInDb = await db.Attachments.FindAsync(upload.AttachmentId);
        Assert.NotNull(attachmentInDb);
        Assert.Equal("uploading", attachmentInDb.Status);
        Assert.Equal($"attachments/{convId:N}/{upload.AttachmentId:N}.png", attachmentInDb.ObjectKey);

        var memberStatus = await service.GetStatusAsync(userB, upload.AttachmentId);
        Assert.Equal("uploading", memberStatus.Status);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.GetStatusAsync(userC, upload.AttachmentId));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.CompleteUploadAsync(userB, upload.AttachmentId));
        await Assert.ThrowsAsync<DomainException>(
            () => service.CompleteUploadAsync(userA, upload.AttachmentId));

        await storage.UploadBytesAsync(attachmentInDb.ObjectKey, new byte[1023], "image/png");
        await Assert.ThrowsAsync<DomainException>(
            () => service.CompleteUploadAsync(userA, upload.AttachmentId));
        Assert.Contains(attachmentInDb.ObjectKey, storage.DeletedObjectKeys);
        Assert.Equal("failed", (await attachmentRepo.GetByIdAsync(upload.AttachmentId))!.Status);

        var successfulUpload = await service.CreateUploadAsync(userA, uploadRequest);
        var successfulAttachment = (await attachmentRepo.GetByIdAsync(successfulUpload.AttachmentId))!;
        await storage.UploadBytesAsync(successfulAttachment.ObjectKey, new byte[1024], "image/png");

        var completed = await service.CompleteUploadAsync(userA, successfulUpload.AttachmentId);
        Assert.Equal("pending", completed.Status);
        Assert.Equal("pending", (await service.CompleteUploadAsync(userA, successfulUpload.AttachmentId)).Status);
        await Assert.ThrowsAsync<DomainException>(
            () => service.GetDownloadUrlAsync(userB, successfulUpload.AttachmentId));

        await attachmentRepo.UpdateStatusAsync(successfulUpload.AttachmentId, "quarantined");
        Assert.Equal("quarantined", (await service.GetStatusAsync(userB, successfulUpload.AttachmentId)).Status);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.GetDownloadUrlAsync(userB, successfulUpload.AttachmentId));

        await attachmentRepo.UpdateStatusAsync(successfulUpload.AttachmentId, "ready");
        var download = await service.GetDownloadUrlAsync(userB, successfulUpload.AttachmentId);
        Assert.Equal(successfulUpload.AttachmentId, download.AttachmentId);
        Assert.Contains("X-Amz-Signature", download.DownloadUrl);
    }

    [Theory]
    [InlineData("../escape.png", "image/png", 1024)]
    [InlineData("folder/file.png", "image/png", 1024)]
    [InlineData("file.exe", "application/x-msdownload", 1024)]
    [InlineData("file.png", "image/png", 0)]
    [InlineData("file.png", "image/png", 26_214_401)]
    public async Task MediaStorageService_CreateUpload_RejectsInvalidMetadata(
        string fileName,
        string contentType,
        long fileSizeBytes)
    {
        using var db = fixture.CreateDbContext();
        var conversationRepository = new PostgresConversationRepository(db);
        var attachmentRepository = new PostgresAttachmentRepository(db);
        var service = new MediaStorageService(
            attachmentRepository,
            new TestStorageService(),
            conversationRepository);
        var conversationId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var otherMemberId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, userId, otherMemberId);
        db.Conversations.Add(new ConversationEntity { Id = conversationId, Title = "Media validation", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = userId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = otherMemberId });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<DomainException>(() => service.CreateUploadAsync(
            userId,
            new CreatePresignedUrlRequest(conversationId, fileName, contentType, fileSizeBytes)));
    }

    [Fact]
    public async Task MediaStorageService_CompleteUpload_ContentTypeMismatch_DeletesObjectAndMarksFailed()
    {
        using var db = fixture.CreateDbContext();
        var storage = new TestStorageService();
        var conversationRepository = new PostgresConversationRepository(db);
        var attachmentRepository = new PostgresAttachmentRepository(db);
        var service = new MediaStorageService(attachmentRepository, storage, conversationRepository);
        var conversationId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var otherMemberId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, userId, otherMemberId);
        db.Conversations.Add(new ConversationEntity { Id = conversationId, Title = "Media mismatch", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = userId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = otherMemberId });
        await db.SaveChangesAsync();

        var upload = await service.CreateUploadAsync(
            userId,
            new CreatePresignedUrlRequest(conversationId, "photo.png", "image/png", 128));
        var attachment = (await attachmentRepository.GetByIdAsync(upload.AttachmentId))!;
        await storage.UploadBytesAsync(attachment.ObjectKey, new byte[128], "text/plain");

        await Assert.ThrowsAsync<DomainException>(
            () => service.CompleteUploadAsync(userId, upload.AttachmentId));
        Assert.Contains(attachment.ObjectKey, storage.DeletedObjectKeys);
        Assert.Equal("failed", (await attachmentRepository.GetByIdAsync(upload.AttachmentId))!.Status);
    }

    [Fact]
    public async Task MediaProcessingWorker_ProcessesPendingAttachments_VirusScanAndThumbnailGeneration()
    {
        using var db = fixture.CreateDbContext();
        var storage = new TestStorageService(returnNonSeekableStreams: true);
        var scanner = new TestClamAvScanner();
        var thumbnailGen = new TestThumbnailGenerator();

        var services = new ServiceCollection();
        services.AddSingleton(db);
        services.AddSingleton<IStorageService>(storage);
        services.AddSingleton<IClamAvScanner>(scanner);
        services.AddSingleton<IThumbnailGenerator>(thumbnailGen);
        services.AddSingleton<IContentTypeDetector, ContentTypeDetector>();
        var scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        var worker = new MediaProcessingWorker(
            scopeFactory,
            Options.Create(new MediaProcessingOptions()),
            NullLogger<MediaProcessingWorker>.Instance);

        var convId = Guid.NewGuid();
        var uploaderId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, uploaderId);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Worker Test Room", LastSequence = 0 });

        // Attachment A: Clean image
        var cleanAttachmentId = Guid.CreateVersion7();
        var cleanKey = $"attachments/{convId}/{cleanAttachmentId:N}_photo.jpg";
        db.Attachments.Add(new AttachmentEntity
        {
            Id = cleanAttachmentId,
            ConversationId = convId,
            UploaderId = uploaderId,
            FileName = "photo.jpg",
            ContentType = "image/jpeg",
            FileSizeBytes = 2048,
            ObjectKey = cleanKey,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        var jpegBytes = new byte[2048];
        jpegBytes[0] = 0xFF;
        jpegBytes[1] = 0xD8;
        jpegBytes[2] = 0xFF;
        using (var ms = new MemoryStream(jpegBytes))
        {
            await storage.UploadObjectAsync(cleanKey, ms, "image/jpeg");
        }

        // Attachment B: Infected file
        var virusAttachmentId = Guid.CreateVersion7();
        var virusKey = $"attachments/{convId}/{virusAttachmentId:N}_eicar_virus_sample.txt";
        db.Attachments.Add(new AttachmentEntity
        {
            Id = virusAttachmentId,
            ConversationId = convId,
            UploaderId = uploaderId,
            FileName = "eicar_virus_sample.txt",
            ContentType = "text/plain",
            FileSizeBytes = 68,
            ObjectKey = virusKey,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });
        using (var ms = new MemoryStream(System.Text.Encoding.ASCII.GetBytes(@"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")))
        {
            await storage.UploadObjectAsync(virusKey, ms, "text/plain");
        }

        // Attachment C: Missing object in storage (GetObjectAsync returns null -> skipped/deferred)
        var missingAttachmentId = Guid.CreateVersion7();
        var missingKey = $"attachments/{convId}/{missingAttachmentId:N}_missing.txt";
        db.Attachments.Add(new AttachmentEntity
        {
            Id = missingAttachmentId,
            ConversationId = convId,
            UploaderId = uploaderId,
            FileName = "missing.txt",
            ContentType = "text/plain",
            FileSizeBytes = 100,
            ObjectKey = missingKey,
            Status = "pending",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync();

        // Run worker processing
        await worker.ProcessPendingAttachmentsAsync(CancellationToken.None);
        db.ChangeTracker.Clear();

        var cleanDb = await db.Attachments.FindAsync(cleanAttachmentId);
        Assert.NotNull(cleanDb);
        Assert.Equal("ready", cleanDb.Status);
        Assert.NotNull(cleanDb.ScannedAt);
        Assert.NotNull(cleanDb.ThumbnailKey);
        Assert.Equal(1, cleanDb.ProcessingAttempts);
        Assert.Null(cleanDb.ProcessingOwner);
        Assert.Null(cleanDb.ProcessingLeaseUntil);

        var virusDb = await db.Attachments.FindAsync(virusAttachmentId);
        Assert.NotNull(virusDb);
        Assert.Equal("quarantined", virusDb.Status);
        Assert.NotNull(virusDb.ScannedAt);
        Assert.Equal("EICAR-Test-Signature", virusDb.QuarantineReason);
        Assert.Equal(1, virusDb.ProcessingAttempts);
        Assert.Null(virusDb.ProcessingOwner);

        var missingDb = await db.Attachments.FindAsync(missingAttachmentId);
        Assert.NotNull(missingDb);
        Assert.Equal("pending", missingDb.Status);
        Assert.Null(missingDb.ScannedAt);
    }

    [Fact]
    public async Task LiveKit_CallTokenService_IssuesValidHs256Jwt_AndEnforcesMembership()
    {
        using var db = fixture.CreateDbContext();
        var convRepo = new PostgresConversationRepository(db);
        var userRepo = new PostgresUserRepository(db);

        var lkOpts = Options.Create(new LiveKitOptions { ServerUrl = "ws://localhost:7880", ApiKey = "devkey", ApiSecret = "secret-dev-key-must-be-at-least-32-bytes-long!" });
        var service = new CallSignalingService(lkOpts, convRepo, userRepo);

        var convId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var member2Id = Guid.NewGuid();
        var nonMemberId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, memberId, member2Id);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Call Test Room", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = memberId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = member2Id });
        await db.SaveChangesAsync();

        // 1. Non-member request -> Expect UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.IssueCallTokenAsync(nonMemberId, convId, CancellationToken.None));

        // 2. Member request -> Expect valid token with claims
        var response = await service.IssueCallTokenAsync(memberId, convId, CancellationToken.None);
        Assert.NotNull(response.Token);
        Assert.Equal("ws://localhost:7880", response.LiveKitUrl);

        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(response.Token);

        Assert.Equal("HS256", jwtToken.Header.Alg);
        Assert.Equal("devkey", jwtToken.Issuer);
        Assert.Equal(memberId.ToString(), jwtToken.Subject);

        var videoClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "video");
        Assert.NotNull(videoClaim);
        Assert.Contains($"conv_{convId}", videoClaim.Value);
    }

    [Fact]
    public async Task RealtimeCallSignaling_DispatchesEventsToGroup()
    {
        var recordingClients = new RecordingChatClients();
        var mockHubContext = new MockHubContext(recordingClients);
        var publisher = new SignalRRealtimePublisher(mockHubContext);

        var convId = Guid.NewGuid();
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();

        await publisher.PublishCallStartedAsync(convId, userA, $"conv_{convId}", "video", CancellationToken.None);
        await publisher.PublishParticipantJoinedAsync(convId, userB, CancellationToken.None);
        await publisher.PublishParticipantLeftAsync(convId, userB, CancellationToken.None);
        await publisher.PublishCallEndedAsync(convId, userA, CancellationToken.None);

        Assert.Single(recordingClients.CallStartedEvents);
        Assert.Equal(convId, recordingClients.CallStartedEvents[0].ConversationId);
        Assert.Equal(userA, recordingClients.CallStartedEvents[0].InitiatorId);

        Assert.Single(recordingClients.ParticipantJoinedEvents);
        Assert.Equal(userB, recordingClients.ParticipantJoinedEvents[0].UserId);

        Assert.Single(recordingClients.ParticipantLeftEvents);
        Assert.Equal(userB, recordingClients.ParticipantLeftEvents[0].UserId);

        Assert.Single(recordingClients.CallEndedEvents);
        Assert.Equal(userA, recordingClients.CallEndedEvents[0].EndedById);
    }

    [Fact]
    public async Task OutboxProcessorWorker_PoisonMessage_QuarantinesAfterMaxRetries()
    {
        using var db = fixture.CreateDbContext();

        var poisonMessage = new OutboxMessageEntity
        {
            Id = Guid.NewGuid(),
            EventType = "MessageCreatedIntegrationEvent",
            Payload = "{ \"InvalidJson\": true }",
            OccurredAt = DateTimeOffset.UtcNow,
            ProcessedAt = null,
            RetryCount = 0,
            IsQuarantined = false
        };

        db.OutboxMessages.Add(poisonMessage);
        await db.SaveChangesAsync();

        var throwingPublisher = new ThrowingRealtimePublisher();
        var services = new ServiceCollection();
        services.AddSingleton(db);
        services.AddSingleton<IRealtimePublisher>(throwingPublisher);
        var scopeFactory = services.BuildServiceProvider().GetRequiredService<IServiceScopeFactory>();

        var worker = new OutboxProcessorWorker(scopeFactory, NullLogger<OutboxProcessorWorker>.Instance);
        var processMethod = typeof(OutboxProcessorWorker).GetMethod("ProcessPendingOutboxMessagesAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(processMethod);

        // Run worker loop 5 times
        for (int i = 0; i < 5; i++)
        {
            await (Task)processMethod.Invoke(worker, [CancellationToken.None])!;
        }

        var dbMessage = await db.OutboxMessages.FindAsync(poisonMessage.Id);
        Assert.NotNull(dbMessage);
        Assert.Equal(5, dbMessage.RetryCount);
        Assert.True(dbMessage.IsQuarantined);
        Assert.NotNull(dbMessage.QuarantinedAt);
        Assert.NotNull(dbMessage.Error);

        // 6th run should skip the quarantined message and do zero attempts
        var countBefore = throwingPublisher.Attempts;
        await (Task)processMethod.Invoke(worker, [CancellationToken.None])!;
        Assert.Equal(countBefore, throwingPublisher.Attempts);
    }

    private sealed class TestStorageService(bool returnNonSeekableStreams = false) : IStorageService
    {
        private readonly Dictionary<string, StoredObject> _objects = new(StringComparer.Ordinal);

        public HashSet<string> DeletedObjectKeys { get; } = new(StringComparer.Ordinal);

        public Task<string> GeneratePresignedUploadUrlAsync(
            string objectKey,
            string contentType,
            TimeSpan expiry,
            CancellationToken cancellationToken = default) =>
            Task.FromResult($"https://storage.test/upload/{Uri.EscapeDataString(objectKey)}?X-Amz-Signature=test");

        public Task<string> GeneratePresignedDownloadUrlAsync(
            string objectKey,
            string fileName,
            TimeSpan expiry,
            CancellationToken cancellationToken = default) =>
            Task.FromResult($"https://storage.test/download/{Uri.EscapeDataString(objectKey)}?X-Amz-Signature=test");

        public async Task UploadObjectAsync(
            string objectKey,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            using var buffer = new MemoryStream();
            await content.CopyToAsync(buffer, cancellationToken);
            _objects[objectKey] = new StoredObject(buffer.ToArray(), contentType);
        }

        public Task<Stream?> GetObjectAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            Stream? stream = null;
            if (_objects.TryGetValue(objectKey, out var storedObject))
            {
                var memoryStream = new MemoryStream(storedObject.Bytes, writable: false);
                stream = returnNonSeekableStreams
                    ? new NonSeekableReadStream(memoryStream)
                    : memoryStream;
            }
            return Task.FromResult(stream);
        }

        public Task<StoredObjectMetadata?> GetObjectMetadataAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            StoredObjectMetadata? metadata = _objects.TryGetValue(objectKey, out var storedObject)
                ? new StoredObjectMetadata(storedObject.Bytes.LongLength, storedObject.ContentType)
                : null;
            return Task.FromResult(metadata);
        }

        public Task DeleteObjectAsync(
            string objectKey,
            CancellationToken cancellationToken = default)
        {
            _objects.Remove(objectKey);
            DeletedObjectKeys.Add(objectKey);
            return Task.CompletedTask;
        }

        public Task UploadBytesAsync(string objectKey, byte[] bytes, string contentType) =>
            UploadObjectAsync(objectKey, new MemoryStream(bytes, writable: false), contentType);

        private sealed record StoredObject(byte[] Bytes, string ContentType);

        private sealed class NonSeekableReadStream(Stream inner) : Stream
        {
            public override bool CanRead => true;
            public override bool CanSeek => false;
            public override bool CanWrite => false;
            public override long Length => throw new NotSupportedException();
            public override long Position
            {
                get => throw new NotSupportedException();
                set => throw new NotSupportedException();
            }

            public override void Flush() => inner.Flush();
            public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
            public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
                inner.ReadAsync(buffer, cancellationToken);
            public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
            public override void SetLength(long value) => throw new NotSupportedException();
            public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

            protected override void Dispose(bool disposing)
            {
                if (disposing)
                {
                    inner.Dispose();
                }

                base.Dispose(disposing);
            }

        }
    }

    private sealed class TestClamAvScanner : IClamAvScanner
    {
        public async Task<VirusScanResult> ScanAsync(
            Stream content,
            string fileName,
            CancellationToken cancellationToken = default)
        {
            _ = fileName;
            using var reader = new StreamReader(content, leaveOpen: true);
            var body = await reader.ReadToEndAsync(cancellationToken);
            return body.Contains("EICAR-STANDARD-ANTIVIRUS-TEST-FILE", StringComparison.Ordinal)
                ? new VirusScanResult(false, "EICAR-Test-Signature")
                : new VirusScanResult(true);
        }
    }

    private sealed class TestThumbnailGenerator : IThumbnailGenerator
    {
        private static readonly byte[] PngBytes = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");

        public Task<ThumbnailResult> GenerateThumbnailAsync(
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default)
        {
            _ = content;
            _ = contentType;
            _ = cancellationToken;
            return Task.FromResult(new ThumbnailResult(true, PngBytes, "image/png"));
        }
    }

    private sealed class ThrowingRealtimePublisher : IRealtimePublisher
    {
        public int Attempts { get; private set; }

        public Task PublishMessageAsync(MessageDto message, CancellationToken cancellationToken)
        {
            Attempts++;
            throw new InvalidOperationException("Simulated publishing failure.");
        }

        public Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class RecordingChatClients : IChatClient
    {
        public List<(Guid ConversationId, Guid InitiatorId, string RoomName, string CallType)> CallStartedEvents { get; } = [];
        public List<(Guid ConversationId, Guid EndedById)> CallEndedEvents { get; } = [];
        public List<(Guid ConversationId, Guid UserId)> ParticipantJoinedEvents { get; } = [];
        public List<(Guid ConversationId, Guid UserId)> ParticipantLeftEvents { get; } = [];

        public Task MessageReceived(MessageDto message) => Task.CompletedTask;
        public Task MessageRead(Guid conversationId, Guid readerId, long sequence, DateTimeOffset readAt) => Task.CompletedTask;
        public Task TypingChanged(Guid conversationId, Guid userId, bool isTyping) => Task.CompletedTask;
        public Task BuzzReceived(Guid conversationId, Guid senderId, DateTimeOffset sentAt) => Task.CompletedTask;
        public Task PresenceChanged(Guid userId, string status, string? customStatus, DateTimeOffset occurredAt) => Task.CompletedTask;

        public Task CallStarted(Guid conversationId, Guid initiatorId, string roomName, string callType)
        {
            CallStartedEvents.Add((conversationId, initiatorId, roomName, callType));
            return Task.CompletedTask;
        }

        public Task CallEnded(Guid conversationId, Guid endedById)
        {
            CallEndedEvents.Add((conversationId, endedById));
            return Task.CompletedTask;
        }

        public Task ParticipantJoined(Guid conversationId, Guid userId)
        {
            ParticipantJoinedEvents.Add((conversationId, userId));
            return Task.CompletedTask;
        }

        public Task ParticipantLeft(Guid conversationId, Guid userId)
        {
            ParticipantLeftEvents.Add((conversationId, userId));
            return Task.CompletedTask;
        }

        public Task CallOfferReceived(Guid conversationId, Guid senderId, string sdp) => Task.CompletedTask;
        public Task CallAnswerReceived(Guid conversationId, Guid senderId, string sdp) => Task.CompletedTask;
        public Task IceCandidateReceived(Guid conversationId, Guid senderId, string candidate, string? sdpMid, int? sdpMLineIndex) => Task.CompletedTask;
    }

    private sealed class MockHubContext(IChatClient clientInstance) : IHubContext<ChatHub, IChatClient>
    {
        public IHubClients<IChatClient> Clients { get; } = new MockHubClients(clientInstance);
        public IGroupManager Groups => throw new NotImplementedException();
    }

    private sealed class MockHubClients(IChatClient clientInstance) : IHubClients<IChatClient>
    {
        public IChatClient All => clientInstance;
        public IChatClient AllExcept(IReadOnlyList<string> excludedConnectionIds) => clientInstance;
        public IChatClient Client(string connectionId) => clientInstance;
        public IChatClient Clients(IReadOnlyList<string> connectionIds) => clientInstance;
        public IChatClient Group(string groupName) => clientInstance;
        public IChatClient GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => clientInstance;
        public IChatClient Groups(IReadOnlyList<string> groupNames) => clientInstance;
        public IChatClient User(string userId) => clientInstance;
        public IChatClient Users(IReadOnlyList<string> userIds) => clientInstance;
    }
}
