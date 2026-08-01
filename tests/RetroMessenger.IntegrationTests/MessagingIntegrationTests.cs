#pragma warning disable CA1707
using System.Security.Claims;
using System.Security.Authentication;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Npgsql;
using RetroMessenger.Api.Authentication;
using RetroMessenger.Api.Realtime;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Admin;
using RetroMessenger.Application.Contacts;
using RetroMessenger.Application.Identity;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Contracts.Authentication;
using RetroMessenger.Contracts.Admin;
using RetroMessenger.Contracts.Contacts;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Domain.Common;
using RetroMessenger.Domain.Messaging;
using RetroMessenger.Infrastructure;
using RetroMessenger.Infrastructure.Authentication;
using RetroMessenger.Infrastructure.Concurrency;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;
using RetroMessenger.Infrastructure.Persistence.Outbox;
using RetroMessenger.Infrastructure.Persistence.Repositories;
using RetroMessenger.Infrastructure.Redis;
using RetroMessenger.Infrastructure.Time;
using StackExchange.Redis;
using Xunit;

namespace RetroMessenger.IntegrationTests;

[Collection("PostgresAndRedis")]
public sealed class MessagingIntegrationTests(PostgresAndRedisFixture fixture)
{
    private const string TestJwtSigningKey =
        "integration-test-only-signing-key-with-at-least-thirty-two-bytes";

    [Fact]
    public void WorkerInfrastructure_ServiceProviderValidation_Succeeds()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder().Build();
        services.AddRetroMessengerWorkerInfrastructure(configuration);

        using var provider = services.BuildServiceProvider(new ServiceProviderOptions
        {
            ValidateOnBuild = true,
            ValidateScopes = true
        });

        using var scope = provider.CreateScope();
        Assert.NotNull(scope.ServiceProvider.GetRequiredService<MessengerDbContext>());
    }

    [Fact]
    public async Task AuthRegistration_IdentityAndProfileShareTheSameId()
    {
        Assert.True(fixture.IsUsingRealContainers);

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:postgres"] = fixture.PostgresConnectionString,
                [$"{JwtOptions.SectionName}:SigningKey"] = TestJwtSigningKey
            })
            .Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddRetroMessengerInfrastructure(configuration);

        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();
        var scopedProvider = scope.ServiceProvider;
        var service = new AuthService(
            scopedProvider.GetRequiredService<IUserRepository>(),
            scopedProvider.GetRequiredService<IIdentityService>(),
            scopedProvider.GetRequiredService<ITransactionRunner>());
        var username = $"identity_{Guid.NewGuid():N}";

        var response = await service.RegisterAsync(
            new RegisterRequest(username, "Identity Integration", "SecretPass123!"),
            CancellationToken.None);

        var db = scopedProvider.GetRequiredService<MessengerDbContext>();
        var identityUser = await db.Users
            .AsNoTracking()
            .SingleAsync(user => user.UserName == username);
        var profile = await db.Profiles
            .AsNoTracking()
            .SingleAsync(user => user.Username == username);

        Assert.Equal(identityUser.Id, profile.Id);
        Assert.Equal(profile.Id, response.User.Id);
    }

    [Fact]
    public async Task SendMessage_FirstTime_Succeeds()
    {
        using var db = fixture.CreateDbContext();

        var convRepo = new PostgresConversationRepository(db);
        var msgRepo = new PostgresMessageRepository(db);
        var service = new SendMessageService(
            msgRepo,
            convRepo,
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock());

        var convId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var friendId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, userId, friendId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = convId,
            Title = "Integration Test Room",
            LastSequence = 0
        });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = userId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = friendId });
        await db.SaveChangesAsync();

        var request = new SendMessageRequest("msg-101", "Hello world");
        var response = await service.ExecuteAsync(userId, convId, request, CancellationToken.None);

        Assert.False(response.IsDuplicate);
        Assert.Equal("Hello world", response.Message.Content);
        Assert.Equal("msg-101", response.Message.ClientMessageId);
        Assert.Equal(1, response.Message.Sequence);
    }

    [Fact]
    public async Task SendMessage_PersistenceFailure_RollsBackSequence()
    {
        using var db = fixture.CreateDbContext();
        var conversationRepository = new PostgresConversationRepository(db);
        var conversationId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var friendId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, senderId, friendId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = conversationId,
            Title = "Rollback Test Room",
            LastSequence = 0
        });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = senderId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = conversationId, UserId = friendId });
        await db.SaveChangesAsync();

        var service = new SendMessageService(
            new FailingMessageRepository(),
            conversationRepository,
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock(),
            new EfTransactionRunner(db));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ExecuteAsync(
                senderId,
                conversationId,
                new SendMessageRequest("rollback-message", "Must not persist"),
                CancellationToken.None));

        using var verificationDb = fixture.CreateDbContext();
        var conversation = await verificationDb.Conversations
            .AsNoTracking()
            .SingleAsync(c => c.Id == conversationId);

        Assert.Equal(0, conversation.LastSequence);
        Assert.False(await verificationDb.Messages.AnyAsync(m => m.ConversationId == conversationId));
        var outboxEntries = await verificationDb.OutboxMessages
            .Where(o => o.EventType == "MessageCreatedIntegrationEvent")
            .ToListAsync();
        Assert.DoesNotContain(
            outboxEntries,
            o => o.Payload.Contains("rollback-message", StringComparison.Ordinal));
    }

    [Fact]
    public async Task SendMessage_RetrySameClientMessageId_ReturnsDuplicate()
    {
        using var db = fixture.CreateDbContext();

        var convRepo = new PostgresConversationRepository(db);
        var msgRepo = new PostgresMessageRepository(db);
        var service = new SendMessageService(
            msgRepo,
            convRepo,
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock());

        var convId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var friendId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, userId, friendId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = convId,
            Title = "Duplicate Room",
            LastSequence = 0
        });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = userId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = friendId });
        await db.SaveChangesAsync();

        var request = new SendMessageRequest("msg-fixed", "Original content");
        var res1 = await service.ExecuteAsync(userId, convId, request, CancellationToken.None);
        var res2 = await service.ExecuteAsync(userId, convId, request, CancellationToken.None);

        Assert.False(res1.IsDuplicate);
        Assert.True(res2.IsDuplicate);
        Assert.Equal(res1.Message.Id, res2.Message.Id);
    }

    [Fact]
    public async Task SendMessage_NonMember_ThrowsUnauthorizedAccess()
    {
        using var db = fixture.CreateDbContext();

        var convRepo = new PostgresConversationRepository(db);
        var msgRepo = new PostgresMessageRepository(db);
        var service = new SendMessageService(
            msgRepo,
            convRepo,
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock());

        var convId = Guid.NewGuid();
        var member1Id = Guid.NewGuid();
        var member2Id = Guid.NewGuid();
        var nonMemberId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, member1Id, member2Id);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Member Room", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = member1Id });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = member2Id });
        await db.SaveChangesAsync();

        var request = new SendMessageRequest("msg-unauth", "Test");
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ExecuteAsync(nonMemberId, convId, request, CancellationToken.None));
    }

    [Fact]
    public async Task SendMessage_ConcurrentParallelRequests_IdenticalClientMessageId_ExactlyOneSucceeds()
    {
        using var db = fixture.CreateDbContext();

        var convRepo = new PostgresConversationRepository(db);
        var msgRepo = new PostgresMessageRepository(db);
        var service = new SendMessageService(
            msgRepo,
            convRepo,
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock());

        var convId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var friendId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, userId, friendId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = convId,
            Title = "Concurrent Idempotency Room",
            LastSequence = 0
        });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = userId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = friendId });
        await db.SaveChangesAsync();

        var clientMsgId = $"concurrent-{Guid.NewGuid():N}";
        var request = new SendMessageRequest(clientMsgId, "Parallel payload");

        const int parallelCount = 10;
        var tasks = Enumerable.Range(0, parallelCount)
            .Select(_ => service.ExecuteAsync(userId, convId, request, CancellationToken.None))
            .ToArray();

        var responses = await Task.WhenAll(tasks);

        Assert.Equal(parallelCount, responses.Length);
        Assert.Single(responses, r => !r.IsDuplicate);
        Assert.Equal(parallelCount - 1, responses.Count(r => r.IsDuplicate));

        var firstId = responses[0].Message.Id;
        var firstSeq = responses[0].Message.Sequence;
        Assert.All(responses, r =>
        {
            Assert.Equal(firstId, r.Message.Id);
            Assert.Equal(firstSeq, r.Message.Sequence);
            Assert.Equal(clientMsgId, r.Message.ClientMessageId);
        });

        // Sequence must have advanced by exactly 1
        var convInDb = await db.Conversations
            .AsNoTracking()
            .SingleOrDefaultAsync(c => c.Id == convId);
        Assert.NotNull(convInDb);
        Assert.Equal(1, convInDb.LastSequence);

        // Exactly 1 message row inserted in DB
        var msgCount = await db.Messages.CountAsync(m => m.SenderId == userId && m.ClientMessageId == clientMsgId);
        Assert.Equal(1, msgCount);
    }

    [Fact]
    public async Task AtomicSequenceGeneration_ConcurrentCalls_IncrementSequentially()
    {
        using var db = fixture.CreateDbContext();
        var convId = Guid.NewGuid();
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Sequence Room", LastSequence = 0 });
        await db.SaveChangesAsync();

        const int concurrentRequests = 50;
        var tasks = Enumerable.Range(0, concurrentRequests)
            .Select(async _ =>
            {
                await using var requestDb = fixture.CreateDbContext();
                var requestRepository = new PostgresConversationRepository(requestDb);
                return await requestRepository.NextSequenceAsync(convId, CancellationToken.None);
            })
            .ToArray();

        var sequences = await Task.WhenAll(tasks);
        Array.Sort(sequences);

        Assert.Equal(concurrentRequests, sequences.Length);
        for (int i = 0; i < concurrentRequests; i++)
        {
            Assert.Equal(i + 1, sequences[i]);
        }
    }

    [Fact]
    public async Task ChatHub_NonMember_SubscriptionAndActions_ThrowHubException()
    {
        using var db = fixture.CreateDbContext();
        var convRepo = new PostgresConversationRepository(db);

        var convId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var otherMemberId = Guid.NewGuid();
        var nonMemberId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, memberId, otherMemberId);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Private Group", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = memberId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = otherMemberId });
        await db.SaveChangesAsync();

        var currentUser = new TestCurrentUserContext(nonMemberId);
        var clock = new SystemClock();
        var buzzService = new BuzzService(convRepo, clock);
        var services = new ServiceCollection().BuildServiceProvider();
        var hub = new ChatHub(currentUser, convRepo, buzzService, services)
        {
            Context = new TestHubCallerContext()
        };

        var subscribeEx = await Assert.ThrowsAsync<HubException>(() => hub.SubscribeConversation(convId));
        Assert.Contains("Unauthorized: Not a member", subscribeEx.Message);

        var typingEx = await Assert.ThrowsAsync<HubException>(() => hub.StartTyping(convId));
        Assert.Contains("Unauthorized: Not a member", typingEx.Message);

        var buzzEx = await Assert.ThrowsAsync<HubException>(() => hub.SendBuzz(convId));
        Assert.Contains("Unauthorized: Not a member", buzzEx.Message);
    }

    [Fact]
    public async Task CompositeUniqueConstraint_SenderAndClientMessageId_EnforcesUniqueness()
    {
        using var db = fixture.CreateDbContext();
        var entityType = db.Model.FindEntityType(typeof(MessageEntity));
        Assert.NotNull(entityType);

        var indexes = entityType.GetIndexes();
        var senderClientIndex = indexes.FirstOrDefault(idx =>
            idx.Properties.Count == 2 &&
            idx.Properties.Any(p => p.Name == nameof(MessageEntity.SenderId)) &&
            idx.Properties.Any(p => p.Name == nameof(MessageEntity.ClientMessageId)));

        Assert.NotNull(senderClientIndex);
        Assert.True(senderClientIndex.IsUnique);

        var senderId = Guid.NewGuid();
        var convId = Guid.NewGuid();
        var clientMsgId = "dup-client-msg-1";

        PostgresAndRedisFixture.AddUserProfiles(db, senderId);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Unique Test Room", LastSequence = 0 });
        db.Messages.Add(new MessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = convId,
            SenderId = senderId,
            ClientMessageId = clientMsgId,
            SequenceNo = 1,
            MessageType = 1,
            Content = "First message",
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        db.Messages.Add(new MessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = convId,
            SenderId = senderId,
            ClientMessageId = clientMsgId,
            SequenceNo = 2,
            MessageType = 1,
            Content = "Duplicate client message id",
            CreatedAt = DateTimeOffset.UtcNow
        });

        if (fixture.IsUsingRealContainers)
        {
            var ex = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            Assert.NotNull(ex.InnerException);
            Assert.IsType<PostgresException>(ex.InnerException);
            Assert.Equal("23505", ((PostgresException)ex.InnerException).SqlState);
        }
    }

    [Fact]
    public async Task CompositeUniqueConstraint_ConversationAndSequenceNo_EnforcesUniqueness()
    {
        using var db = fixture.CreateDbContext();
        var entityType = db.Model.FindEntityType(typeof(MessageEntity));
        Assert.NotNull(entityType);

        var indexes = entityType.GetIndexes();
        var convSeqIndex = indexes.FirstOrDefault(idx =>
            idx.Properties.Count == 2 &&
            idx.Properties.Any(p => p.Name == nameof(MessageEntity.ConversationId)) &&
            idx.Properties.Any(p => p.Name == nameof(MessageEntity.SequenceNo)));

        Assert.NotNull(convSeqIndex);
        Assert.True(convSeqIndex.IsUnique);

        var convId = Guid.NewGuid();
        var firstSenderId = Guid.NewGuid();
        var secondSenderId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, firstSenderId, secondSenderId);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Seq Unique Room", LastSequence = 0 });
        db.Messages.Add(new MessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = convId,
            SenderId = firstSenderId,
            ClientMessageId = "msg-a",
            SequenceNo = 10,
            MessageType = 1,
            Content = "Seq 10 original",
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        db.Messages.Add(new MessageEntity
        {
            Id = Guid.NewGuid(),
            ConversationId = convId,
            SenderId = secondSenderId,
            ClientMessageId = "msg-b",
            SequenceNo = 10,
            MessageType = 1,
            Content = "Seq 10 collision",
            CreatedAt = DateTimeOffset.UtcNow
        });

        if (fixture.IsUsingRealContainers)
        {
            var ex = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            Assert.NotNull(ex.InnerException);
            Assert.IsType<PostgresException>(ex.InnerException);
            Assert.Equal("23505", ((PostgresException)ex.InnerException).SqlState);
        }
    }

    [Fact]
    public async Task TransactionalOutbox_MessageAndOutboxStoredAtomically_WorkerDispatchesPostCommit()
    {
        using var db = fixture.CreateDbContext();
        var msgRepo = new PostgresMessageRepository(db);
        var convId = Guid.NewGuid();
        var senderId = Guid.NewGuid();

        PostgresAndRedisFixture.AddUserProfiles(db, senderId);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Outbox Test Room", LastSequence = 0 });
        await db.SaveChangesAsync();

        var message = RetroMessenger.Domain.Messaging.Message.CreateText(convId, senderId, "outbox-client-1", 1, "Outbox message content", DateTimeOffset.UtcNow);
        await msgRepo.AddAsync(message, CancellationToken.None);

        var savedMessage = await db.Messages.FirstOrDefaultAsync(m => m.Id == message.Id);
        var messageOutboxEntries = await db.OutboxMessages
            .Where(o => o.EventType == "MessageCreatedIntegrationEvent")
            .ToListAsync();
        var outboxEntry = messageOutboxEntries.FirstOrDefault(o => o.Payload.Contains("outbox-client-1", StringComparison.Ordinal));

        Assert.NotNull(savedMessage);
        Assert.NotNull(outboxEntry);
        Assert.Null(outboxEntry.ProcessedAt);

        // Test OutboxProcessorWorker dispatch
        var recordingPublisher = new RecordingRealtimePublisher();
        var services = new ServiceCollection();
        services.AddSingleton<MessengerDbContext>(db);
        services.AddSingleton<IRealtimePublisher>(recordingPublisher);
        var serviceProvider = services.BuildServiceProvider();
        var scopeFactory = serviceProvider.GetRequiredService<IServiceScopeFactory>();

        var worker = new OutboxProcessorWorker(scopeFactory, NullLogger<OutboxProcessorWorker>.Instance);

        // Trigger processing loop via reflection method call
        var processMethod = typeof(OutboxProcessorWorker).GetMethod("ProcessPendingOutboxMessagesAsync", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        Assert.NotNull(processMethod);
        await (Task)processMethod.Invoke(worker, [CancellationToken.None])!;

        Assert.Single(recordingPublisher.PublishedMessages);
        Assert.Equal("Outbox message content", recordingPublisher.PublishedMessages[0].Content);

        var updatedOutbox = await db.OutboxMessages.FirstOrDefaultAsync(o => o.Id == outboxEntry.Id);
        Assert.NotNull(updatedOutbox?.ProcessedAt);
    }

    [Fact]
    public async Task RedisPresenceService_SetUserOnlineAndTyping_SetsKeysWithTTL()
    {
        IPresenceService presenceService;
        if (fixture.IsUsingRealContainers && fixture.RedisMultiplexer is not null)
        {
            presenceService = new RedisPresenceService(fixture.RedisMultiplexer);
        }
        else
        {
            presenceService = new InMemoryPresenceService();
        }

        var userId = Guid.NewGuid();
        var deviceId = Guid.NewGuid();
        var convId = Guid.NewGuid();

        await presenceService.SetUserOnlineAsync(userId, deviceId, TimeSpan.FromMinutes(5));
        var isOnline = await presenceService.IsUserOnlineAsync(userId);
        Assert.True(isOnline);

        await presenceService.SetTypingAsync(convId, userId, TimeSpan.FromSeconds(10));
        await presenceService.ClearTypingAsync(convId, userId);

        await presenceService.SetUserOfflineAsync(userId, deviceId);
        var isOffline = await presenceService.IsUserOnlineAsync(userId);
        Assert.False(isOffline);
    }

    [Fact]
    public async Task IdentityAndAuth_UserRegisterLoginTokenIssuanceAndClaims_Succeeds()
    {
        using var db = fixture.CreateDbContext();
        var userRepo = new PostgresUserRepository(db);

        var services = new ServiceCollection();
        services.AddSingleton(db);
        var identityService = new IdentityService(
            services.BuildServiceProvider(),
            Options.Create(new JwtOptions { SigningKey = TestJwtSigningKey }));
        var authService = new AuthService(userRepo, identityService);

        // 1. Register User
        var regRequest = new RegisterRequest("john_doe", "John Doe", "SecretPass123!");
        var regResponse = await authService.RegisterAsync(regRequest);

        Assert.NotNull(regResponse.AccessToken);
        Assert.NotNull(regResponse.RefreshToken);
        Assert.Equal("john_doe", regResponse.User.Username);
        Assert.Equal("John Doe", regResponse.User.DisplayName);

        // 2. Login User
        var loginRequest = new LoginRequest("john_doe", "SecretPass123!");
        var loginResponse = await authService.LoginAsync(loginRequest);

        Assert.NotNull(loginResponse.AccessToken);
        Assert.Equal(regResponse.User.Id, loginResponse.User.Id);

        var loginRefreshHash = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(loginResponse.RefreshToken)))
            .ToLowerInvariant();
        var persistedLoginSession = await db.RefreshSessions
            .AsNoTracking()
            .SingleAsync(x => x.TokenHash == loginRefreshHash);
        Assert.Equal(regResponse.User.Id, persistedLoginSession.UserId);
        Assert.DoesNotContain(
            loginResponse.RefreshToken,
            await db.RefreshSessions.AsNoTracking().Select(x => x.TokenHash).ToListAsync());

        // 3. Refresh Token Exchange
        var refreshRequest = new RefreshTokenRequest(loginResponse.RefreshToken);
        var refreshResponse = await authService.RefreshTokenAsync(refreshRequest);

        Assert.NotNull(refreshResponse.AccessToken);
        Assert.NotEqual(loginResponse.AccessToken, refreshResponse.AccessToken);
        Assert.Equal(regResponse.User.Id, refreshResponse.User.Id);

        await Assert.ThrowsAsync<AuthenticationException>(() =>
            authService.RefreshTokenAsync(new RefreshTokenRequest(loginResponse.AccessToken)));

        await Assert.ThrowsAsync<AuthenticationException>(() =>
            authService.RefreshTokenAsync(refreshRequest));
        await Assert.ThrowsAsync<AuthenticationException>(() =>
            authService.RefreshTokenAsync(new RefreshTokenRequest(refreshResponse.RefreshToken)));

        var logoutSession = await authService.LoginAsync(loginRequest);
        await authService.LogoutAsync(new RefreshTokenRequest(logoutSession.RefreshToken));
        await Assert.ThrowsAsync<AuthenticationException>(() =>
            authService.RefreshTokenAsync(new RefreshTokenRequest(logoutSession.RefreshToken)));

        // 4. HttpCurrentUserContext claim extraction
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, regResponse.User.Id.ToString()),
            new Claim(ClaimTypes.Name, "john_doe")
        };
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"))
        };

        var httpAccessor = new HttpContextAccessor { HttpContext = httpContext };
        var userContext = new HttpCurrentUserContext(httpAccessor);

        Assert.True(userContext.IsAuthenticated);
        Assert.Equal(regResponse.User.Id, userContext.UserId);

        var spoofedContext = new DefaultHttpContext();
        spoofedContext.Request.Headers["X-User-Id"] = Guid.NewGuid().ToString();
        var spoofedAccessor = new HttpContextAccessor { HttpContext = spoofedContext };
        var spoofedUserContext = new HttpCurrentUserContext(spoofedAccessor);

        Assert.False(spoofedUserContext.IsAuthenticated);
        Assert.Equal(Guid.Empty, spoofedUserContext.UserId);
    }

    [Fact]
    public async Task RefreshToken_ConcurrentReuse_AllowsOneRotationAndRevokesReplacementFamily()
    {
        Assert.True(fixture.IsUsingRealContainers);

        Guid userId;
        string refreshToken;
        await using (var setupDb = fixture.CreateDbContext())
        {
            userId = Guid.NewGuid();
            PostgresAndRedisFixture.AddUserProfiles(setupDb, userId);
            await setupDb.SaveChangesAsync();

            var services = new ServiceCollection();
            services.AddSingleton(setupDb);
            var identity = new IdentityService(
                services.BuildServiceProvider(),
                Options.Create(new JwtOptions { SigningKey = TestJwtSigningKey }));
            (_, refreshToken) = await identity.GenerateTokensAsync(
                userId,
                $"test_{userId:N}");
        }

        async Task<(bool Succeeded, string RefreshToken)> RotateAsync()
        {
            await using var requestDb = fixture.CreateDbContext();
            var services = new ServiceCollection();
            services.AddSingleton(requestDb);
            var identity = new IdentityService(
                services.BuildServiceProvider(),
                Options.Create(new JwtOptions { SigningKey = TestJwtSigningKey }));
            var result = await identity.RefreshTokenAsync(refreshToken);
            return (result.Succeeded, result.RefreshToken);
        }

        var results = await Task.WhenAll(RotateAsync(), RotateAsync());
        var succeeded = Assert.Single(results, x => x.Succeeded);
        Assert.Single(results, x => !x.Succeeded);

        await using var verifyDb = fixture.CreateDbContext();
        var verifyServices = new ServiceCollection();
        verifyServices.AddSingleton(verifyDb);
        var verifyIdentity = new IdentityService(
            verifyServices.BuildServiceProvider(),
            Options.Create(new JwtOptions { SigningKey = TestJwtSigningKey }));

        var replayedReplacement = await verifyIdentity.RefreshTokenAsync(succeeded.RefreshToken);
        Assert.False(replayedReplacement.Succeeded);
        Assert.True(await verifyDb.RefreshSessions
            .Where(x => x.UserId == userId)
            .AllAsync(x => x.RevokedAt != null || x.ConsumedAt != null));
    }

    [Fact]
    public async Task ContactRequest_RecipientOwnershipAndSymmetricRelationships_AreEnforced()
    {
        using var db = fixture.CreateDbContext();
        var senderId = Guid.NewGuid();
        var recipientId = Guid.NewGuid();
        var unrelatedId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, senderId, recipientId, unrelatedId);
        await db.SaveChangesAsync();

        var repository = new PostgresContactRepository(db);
        var service = new ContactService(repository);
        var recipientUsername = $"test_{recipientId:N}";

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.SendFriendRequestAsync(
                senderId,
                new SendFriendRequest("missing-user")));
        await Assert.ThrowsAsync<DomainException>(() =>
            service.SendFriendRequestAsync(
                senderId,
                new SendFriendRequest($"test_{senderId:N}")));

        var request = await service.SendFriendRequestAsync(
            senderId,
            new SendFriendRequest(recipientUsername));
        Assert.Equal(senderId, request.SenderId);
        Assert.Equal($"Test User {senderId:N}", request.SenderDisplayName);

        var incoming = await service.GetPendingRequestsAsync(recipientId);
        Assert.Single(incoming);
        Assert.Equal(request.RequestId, incoming.Single().RequestId);
        Assert.Empty(await service.GetPendingRequestsAsync(unrelatedId));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.AcceptFriendRequestAsync(request.RequestId, unrelatedId));
        Assert.Equal(
            "pending",
            (await db.ContactRequests.AsNoTracking()
                .SingleAsync(x => x.Id == request.RequestId)).Status);

        await service.AcceptFriendRequestAsync(request.RequestId, recipientId);

        var relationships = await db.Contacts.AsNoTracking()
            .Where(x =>
                (x.UserId == senderId && x.ContactId == recipientId) ||
                (x.UserId == recipientId && x.ContactId == senderId))
            .ToListAsync();
        Assert.Equal(2, relationships.Count);
        Assert.All(relationships, x => Assert.Equal("accepted", x.Status));

        var senderFriends = await service.GetFriendsAsync(senderId);
        var recipientFriends = await service.GetFriendsAsync(recipientId);
        Assert.Equal(recipientId, Assert.Single(senderFriends).UserId);
        Assert.Equal(senderId, Assert.Single(recipientFriends).UserId);

        await Assert.ThrowsAsync<DomainException>(() =>
            service.AcceptFriendRequestAsync(request.RequestId, recipientId));
        await Assert.ThrowsAsync<DomainException>(() =>
            service.SendFriendRequestAsync(
                senderId,
                new SendFriendRequest(recipientUsername)));
    }

    [Fact]
    public async Task ContactLifecycle_CancelRejectBlockAndUnblock_AreAuthorized()
    {
        using var db = fixture.CreateDbContext();
        var senderId = Guid.NewGuid();
        var recipientId = Guid.NewGuid();
        var unrelatedId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, senderId, recipientId, unrelatedId);
        await db.SaveChangesAsync();
        var service = new ContactService(new PostgresContactRepository(db));
        var recipientUsername = $"test_{recipientId:N}";

        var request = await service.SendFriendRequestAsync(
            senderId,
            new SendFriendRequest(recipientUsername));
        var senderState = await service.GetRequestStateAsync(senderId);
        var recipientState = await service.GetRequestStateAsync(recipientId);
        Assert.Equal(request.RequestId, Assert.Single(senderState.Outgoing).RequestId);
        Assert.Equal(request.RequestId, Assert.Single(recipientState.Incoming).RequestId);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CancelFriendRequestAsync(request.RequestId, unrelatedId));
        await service.CancelFriendRequestAsync(request.RequestId, senderId);
        Assert.Empty((await service.GetRequestStateAsync(senderId)).Outgoing);

        request = await service.SendFriendRequestAsync(senderId, new SendFriendRequest(recipientUsername));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.RejectFriendRequestAsync(request.RequestId, unrelatedId));
        await service.RejectFriendRequestAsync(request.RequestId, recipientId);
        Assert.Equal("rejected", (await db.ContactRequests.AsNoTracking()
            .SingleAsync(x => x.Id == request.RequestId)).Status);

        request = await service.SendFriendRequestAsync(senderId, new SendFriendRequest(recipientUsername));
        await service.AcceptFriendRequestAsync(request.RequestId, recipientId);
        var blocked = await service.BlockAsync(senderId, recipientId);
        Assert.Equal(recipientId, blocked.UserId);
        Assert.Empty(await service.GetFriendsAsync(senderId));
        Assert.Empty(await service.GetFriendsAsync(recipientId));
        Assert.Equal(recipientId, Assert.Single(await service.GetBlockedContactsAsync(senderId)).UserId);
        await Assert.ThrowsAsync<DomainException>(() =>
            service.SendFriendRequestAsync(recipientId, new SendFriendRequest($"test_{senderId:N}")));

        await service.UnblockAsync(senderId, recipientId);
        Assert.Empty(await service.GetBlockedContactsAsync(senderId));
        var afterUnblock = await service.SendFriendRequestAsync(
            recipientId,
            new SendFriendRequest($"test_{senderId:N}"));
        Assert.Equal(recipientId, afterUnblock.SenderId);
    }

    [Fact]
    public async Task SendMessage_DirectConversationBlockedPair_IsRejectedBeforeSequenceAllocation()
    {
        using var db = fixture.CreateDbContext();
        var senderId = Guid.NewGuid();
        var recipientId = Guid.NewGuid();
        var conversationId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, senderId, recipientId);
        db.Conversations.Add(new ConversationEntity
        {
            Id = conversationId,
            Title = "Blocked direct chat",
            LastSequence = 0
        });
        db.ConversationMembers.AddRange(
            new ConversationMemberEntity { ConversationId = conversationId, UserId = senderId },
            new ConversationMemberEntity { ConversationId = conversationId, UserId = recipientId });
        await db.SaveChangesAsync();

        var contacts = new PostgresContactRepository(db);
        await contacts.BlockAsync(senderId, recipientId);
        var service = new SendMessageService(
            new PostgresMessageRepository(db),
            new PostgresConversationRepository(db),
            new NoOpRealtimePublisher(),
            new InMemoryIdempotencyLock(),
            new SystemClock(),
            contacts: contacts);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => service.ExecuteAsync(
            senderId,
            conversationId,
            new SendMessageRequest("blocked-message", "must not be sent"),
            CancellationToken.None));
        Assert.Equal(0, await db.Conversations.AsNoTracking()
            .Where(x => x.Id == conversationId)
            .Select(x => x.LastSequence)
            .SingleAsync());
        Assert.Empty(await db.Messages.AsNoTracking()
            .Where(x => x.ConversationId == conversationId)
            .ToListAsync());
    }

    [Fact]
    public async Task AdminSuspension_RequiresReasonPersistsAuditAndEmitsRoleClaim()
    {
        using var db = fixture.CreateDbContext();
        var adminId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, adminId, targetId);

        var roleId = Guid.NewGuid();
        db.Roles.Add(new IdentityRole<Guid>
        {
            Id = roleId,
            Name = "admin",
            NormalizedName = $"ADMIN_{roleId:N}"
        });
        db.Users.AddRange(
            new ApplicationUser
            {
                Id = adminId,
                UserName = $"test_{adminId:N}",
                NormalizedUserName = $"TEST_{adminId:N}".ToUpperInvariant(),
                DisplayName = "Admin Test"
            },
            new ApplicationUser
            {
                Id = targetId,
                UserName = $"test_{targetId:N}",
                NormalizedUserName = $"TEST_{targetId:N}".ToUpperInvariant(),
                DisplayName = "Target Test"
            });
        db.UserRoles.Add(new IdentityUserRole<Guid>
        {
            UserId = adminId,
            RoleId = roleId
        });
        await db.SaveChangesAsync();

        var identityServices = new ServiceCollection();
        identityServices.AddSingleton(db);
        var identity = new IdentityService(
            identityServices.BuildServiceProvider(),
            Options.Create(new JwtOptions { SigningKey = TestJwtSigningKey }));
        var (accessToken, _) = await identity.GenerateTokensAsync(
            adminId,
            $"test_{adminId:N}");
        var jwt = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()
            .ReadJwtToken(accessToken);
        Assert.Contains(jwt.Claims, claim =>
            claim.Type == "role" && claim.Value == "admin");

        var service = new AdminService(new PostgresAdminRepository(db));
        await Assert.ThrowsAsync<DomainException>(() =>
            service.SetUserSuspensionAsync(
                adminId,
                adminId,
                new SetUserSuspensionRequest(true, "Self suspension is forbidden")));
        await Assert.ThrowsAsync<DomainException>(() =>
            service.SetUserSuspensionAsync(
                adminId,
                targetId,
                new SetUserSuspensionRequest(true, "short")));

        const string suspendReason = "Repeated automated abuse confirmed by moderation.";
        await service.SetUserSuspensionAsync(
            adminId,
            targetId,
            new SetUserSuspensionRequest(true, suspendReason));

        var suspendedUser = await db.Users.AsNoTracking().SingleAsync(x => x.Id == targetId);
        Assert.True(suspendedUser.LockoutEnabled);
        Assert.True(suspendedUser.LockoutEnd > DateTimeOffset.UtcNow);
        Assert.Equal(
            "offline",
            (await db.Profiles.AsNoTracking().SingleAsync(x => x.Id == targetId)).Status);

        var suspendAudit = await db.AdminAuditLogs.AsNoTracking().SingleAsync(
            x => x.ActorId == adminId && x.TargetId == targetId);
        Assert.Equal("user.suspended", suspendAudit.Action);
        Assert.Equal(suspendReason, suspendAudit.Reason);

        await service.SetUserSuspensionAsync(
            adminId,
            targetId,
            new SetUserSuspensionRequest(false, "Appeal approved after manual administrator review."));
        Assert.Null((await db.Users.AsNoTracking().SingleAsync(x => x.Id == targetId)).LockoutEnd);
        Assert.Equal(
            2,
            await db.AdminAuditLogs.CountAsync(x => x.ActorId == adminId && x.TargetId == targetId));
    }

    [Fact]
    public async Task BuzzService_RateLimiting_EnforcesCooldown()
    {
        using var db = fixture.CreateDbContext();
        var convRepo = new PostgresConversationRepository(db);
        var clock = new SystemClock();
        var buzzService = new BuzzService(convRepo, clock);

        var convId = Guid.NewGuid();
        var memberId = Guid.NewGuid();
        var member2Id = Guid.NewGuid();
        PostgresAndRedisFixture.AddUserProfiles(db, memberId, member2Id);
        db.Conversations.Add(new ConversationEntity { Id = convId, Title = "Buzz Room", LastSequence = 0 });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = memberId });
        db.ConversationMembers.Add(new ConversationMemberEntity { ConversationId = convId, UserId = member2Id });
        await db.SaveChangesAsync();

        // First Buzz allowed
        await buzzService.VerifyBuzzAllowedAsync(memberId, convId, CancellationToken.None);

        // Immediate second Buzz throws rate limit DomainException
        var ex = await Assert.ThrowsAsync<DomainException>(() =>
            buzzService.VerifyBuzzAllowedAsync(memberId, convId, CancellationToken.None));

        Assert.Contains("wait a few seconds", ex.Message);
    }

    private sealed class NoOpRealtimePublisher : IRealtimePublisher
    {
        public Task PublishMessageAsync(MessageDto message, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class FailingMessageRepository : IMessageRepository
    {
        public Task<Message?> FindByClientMessageIdAsync(
            Guid senderId,
            string clientMessageId,
            CancellationToken cancellationToken) =>
            Task.FromResult<Message?>(null);

        public Task<IReadOnlyList<Message>> ListAsync(
            Guid conversationId,
            long? afterSequence,
            int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Message>>([]);

        public Task AddAsync(Message message, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("Simulated persistence failure.");
    }

    private sealed class RecordingRealtimePublisher : IRealtimePublisher
    {
        public List<MessageDto> PublishedMessages { get; } = [];

        public Task PublishMessageAsync(MessageDto message, CancellationToken cancellationToken)
        {
            PublishedMessages.Add(message);
            return Task.CompletedTask;
        }

        public Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class InMemoryPresenceService : IPresenceService
    {
        private readonly HashSet<Guid> _onlineUsers = [];

        public Task SetUserOnlineAsync(Guid userId, Guid deviceId, TimeSpan ttl, CancellationToken cancellationToken = default)
        {
            _onlineUsers.Add(userId);
            return Task.CompletedTask;
        }

        public Task SetUserOfflineAsync(Guid userId, Guid deviceId, CancellationToken cancellationToken = default)
        {
            _onlineUsers.Remove(userId);
            return Task.CompletedTask;
        }

        public Task SetTypingAsync(Guid conversationId, Guid userId, TimeSpan ttl, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task ClearTypingAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<bool> IsUserOnlineAsync(Guid userId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_onlineUsers.Contains(userId));
    }

    private sealed class TestCurrentUserContext(Guid userId) : ICurrentUserContext
    {
        public Guid UserId => userId;
        public Guid DeviceId => Guid.Empty;
        public bool IsAuthenticated => userId != Guid.Empty;
    }

    private sealed class TestHubCallerContext : HubCallerContext
    {
        public override string ConnectionId { get; } = Guid.NewGuid().ToString("N");
        public override string? UserIdentifier { get; } = Guid.NewGuid().ToString("N");
        public override ClaimsPrincipal? User { get; }
        public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
        public override IFeatureCollection Features { get; } = new FeatureCollection();
        public override CancellationToken ConnectionAborted => CancellationToken.None;
        public override void Abort() { }
    }
}
