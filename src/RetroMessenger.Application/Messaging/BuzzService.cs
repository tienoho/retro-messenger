using System.Collections.Concurrent;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Domain.Common;

namespace RetroMessenger.Application.Messaging;

public sealed class BuzzService(
    IConversationRepository conversations,
    IClock clock)
{
    private static readonly ConcurrentDictionary<Guid, DateTimeOffset> LastBuzzTimes = new();
    private static readonly TimeSpan BuzzCooldown = TimeSpan.FromSeconds(5);

    public async Task VerifyBuzzAllowedAsync(
        Guid senderId,
        Guid conversationId,
        CancellationToken cancellationToken = default)
    {
        if (senderId == Guid.Empty)
        {
            throw new DomainException("Sender is required.");
        }

        var conversation = await conversations.GetAsync(conversationId, cancellationToken)
            ?? throw new KeyNotFoundException("Conversation was not found.");

        if (!conversation.HasMember(senderId))
        {
            throw new UnauthorizedAccessException("Sender is not a member of this conversation.");
        }

        var now = clock.UtcNow;
        if (LastBuzzTimes.TryGetValue(conversationId, out var lastTime))
        {
            if (now - lastTime < BuzzCooldown)
            {
                throw new DomainException("Please wait a few seconds before sending another Buzz.");
            }
        }

        LastBuzzTimes[conversationId] = now;
    }
}
