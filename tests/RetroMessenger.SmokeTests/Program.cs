using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Infrastructure.Concurrency;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Time;

var messages = new InMemoryMessageRepository();
var conversations = new InMemoryConversationRepository();
var realtime = new RecordingRealtimePublisher();
var service = new SendMessageService(
    messages,
    conversations,
    realtime,
    new InMemoryIdempotencyLock(),
    new SystemClock());

var clientMessageId = $"smoke-{Guid.NewGuid():N}";

var attempts = Enumerable.Range(0, 8)
    .Select(_ => service.ExecuteAsync(
        DemoData.CurrentUser.Id,
        DemoData.ConversationId,
        new SendMessageRequest(
            clientMessageId,
            "Concurrent smoke test"),
        CancellationToken.None))
    .ToArray();

var results = await Task.WhenAll(attempts);

if (results.Count(x => !x.IsDuplicate) != 1)
{
    throw new InvalidOperationException(
        "Exactly one concurrent attempt must create the message.");
}

if (results.Count(x => x.IsDuplicate) != 7)
{
    throw new InvalidOperationException(
        "All retries must resolve to the existing message.");
}

if (results.Select(x => x.Message.Id).Distinct().Count() != 1)
{
    throw new InvalidOperationException(
        "All attempts must return the same message ID.");
}

if (realtime.Count != 1)
{
    throw new InvalidOperationException(
        "Concurrent retries must publish only one realtime event.");
}

Console.WriteLine(
    "PASS: concurrent idempotency and single realtime publication.");

sealed class RecordingRealtimePublisher : IRealtimePublisher
{
    private int _count;

    public int Count => Volatile.Read(ref _count);

    public Task PublishMessageAsync(
        MessageDto message,
        CancellationToken cancellationToken)
    {
        Interlocked.Increment(ref _count);
        return Task.CompletedTask;
    }

    public Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
    public Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) => Task.CompletedTask;
}
