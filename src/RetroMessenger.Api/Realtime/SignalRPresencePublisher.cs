using Microsoft.AspNetCore.SignalR;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Realtime;

namespace RetroMessenger.Api.Realtime;

public sealed class SignalRPresencePublisher(
    IHubContext<ChatHub, IChatClient> hubContext,
    IContactRepository contacts) : IPresencePublisher
{
    public async Task PublishAsync(
        Guid userId,
        string status,
        string? customStatus,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken = default)
    {
        var friends = await contacts.GetContactsAsync(userId, cancellationToken);
        var groups = friends.Select(friend => ChatHub.UserGroup(friend.UserId))
            .Append(ChatHub.UserGroup(userId))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        if (groups.Length == 0) return;
        await hubContext.Clients.Groups(groups)
            .PresenceChanged(userId, status, customStatus, occurredAt);
    }
}
