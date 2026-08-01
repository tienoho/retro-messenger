using Microsoft.AspNetCore.SignalR;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Messaging;
using RetroMessenger.Contracts.Realtime;

namespace RetroMessenger.Api.Realtime;

public sealed class SignalRRealtimePublisher(
    IHubContext<ChatHub, IChatClient> hubContext) : IRealtimePublisher
{
    public Task PublishMessageAsync(MessageDto message, CancellationToken cancellationToken) =>
        hubContext.Clients
            .Group(ChatHub.ConversationGroup(message.ConversationId))
            .MessageReceived(message);

    public Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken) =>
        hubContext.Clients
            .Group(ChatHub.ConversationGroup(conversationId))
            .CallStarted(conversationId, initiatorId, roomName, callType);

    public Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken) =>
        hubContext.Clients
            .Group(ChatHub.ConversationGroup(conversationId))
            .CallEnded(conversationId, endedById);

    public Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) =>
        hubContext.Clients
            .Group(ChatHub.ConversationGroup(conversationId))
            .ParticipantJoined(conversationId, userId);

    public Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken) =>
        hubContext.Clients
            .Group(ChatHub.ConversationGroup(conversationId))
            .ParticipantLeft(conversationId, userId);
}
