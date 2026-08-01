using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Domain.Common;
using RetroMessenger.Domain.Messaging;

namespace RetroMessenger.Application.Messaging;

public sealed class SendMessageService(
    IMessageRepository messages,
    IConversationRepository conversations,
    IRealtimePublisher realtime,
    IIdempotencyLock idempotencyLock,
    IClock clock,
    ITransactionRunner? transactionRunner = null,
    IContactRepository? contacts = null)
{
    public async Task<SendMessageResponse> ExecuteAsync(
        Guid senderId,
        Guid conversationId,
        SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        if (senderId == Guid.Empty)
        {
            throw new DomainException("Sender is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ClientMessageId))
        {
            throw new DomainException("Client message ID is required.");
        }

        var lockKey = $"message:{senderId:N}:{request.ClientMessageId.Trim()}";
        await using var handle = await idempotencyLock.AcquireAsync(
            lockKey,
            cancellationToken);

        var duplicate = await messages.FindByClientMessageIdAsync(
            senderId,
            request.ClientMessageId,
            cancellationToken);

        if (duplicate is not null)
        {
            return new SendMessageResponse(
                duplicate.ToDto(),
                IsDuplicate: true);
        }

        var conversation = await conversations.GetAsync(
            conversationId,
            cancellationToken)
            ?? throw new KeyNotFoundException(
                "Conversation was not found.");

        if (!conversation.HasMember(senderId))
        {
            throw new UnauthorizedAccessException(
                "Sender is not a member of this conversation.");
        }

        if (contacts is not null && conversation.MemberIds.Count == 2)
        {
            var otherUserId = conversation.MemberIds.Single(id => id != senderId);
            if (await contacts.IsBlockedPairAsync(senderId, otherUserId, cancellationToken))
            {
                throw new UnauthorizedAccessException("Messaging is blocked between these users.");
            }
        }

        var message = await (transactionRunner ?? PassthroughTransactionRunner.Instance)
            .ExecuteAsync(async transactionCancellationToken =>
            {
                var sequence = await conversations.NextSequenceAsync(
                    conversationId,
                    transactionCancellationToken);

                var createdMessage = Message.CreateText(
                    conversationId,
                    senderId,
                    request.ClientMessageId,
                    sequence,
                    request.Content,
                    clock.UtcNow);

                await messages.AddAsync(
                    createdMessage,
                    transactionCancellationToken);

                return createdMessage;
            }, cancellationToken);

        // In-memory starter publishes directly. PostgreSQL persistence saves an outbox event
        // which is processed by OutboxProcessorWorker after database commit.
        if (messages.GetType().Name.Contains("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            await realtime.PublishMessageAsync(
                message.ToDto(),
                cancellationToken);
        }

        return new SendMessageResponse(
            message.ToDto(),
            IsDuplicate: false);
    }

    private sealed class PassthroughTransactionRunner : ITransactionRunner
    {
        public static PassthroughTransactionRunner Instance { get; } = new();

        public Task<T> ExecuteAsync<T>(
            Func<CancellationToken, Task<T>> action,
            CancellationToken cancellationToken) =>
            action(cancellationToken);
    }
}
