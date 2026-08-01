using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Realtime;
using RetroMessenger.Infrastructure.Redis;

namespace RetroMessenger.Api.Realtime;

[Authorize]
public sealed class ChatHub(
    ICurrentUserContext currentUser,
    IConversationRepository conversationRepository,
    RetroMessenger.Application.Messaging.BuzzService buzzService,
    IServiceProvider serviceProvider) : Hub<IChatClient>
{
    public override async Task OnConnectedAsync()
    {
        var userId = currentUser.UserId;
        if (userId != Guid.Empty)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                UserGroup(userId));
        }

        await base.OnConnectedAsync();
    }

    public async Task SubscribeConversation(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            ConversationGroup(conversationId));
    }

    public async Task StartTyping(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);

        var presence = serviceProvider.GetService<IPresenceService>();
        if (presence is not null)
        {
            await presence.SetTypingAsync(conversationId, currentUser.UserId, TimeSpan.FromSeconds(5));
        }

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .TypingChanged(conversationId, currentUser.UserId, true);
    }

    public async Task StopTyping(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);

        var presence = serviceProvider.GetService<IPresenceService>();
        if (presence is not null)
        {
            await presence.ClearTypingAsync(conversationId, currentUser.UserId);
        }

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .TypingChanged(conversationId, currentUser.UserId, false);
    }

    public async Task SendBuzz(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        await buzzService.VerifyBuzzAllowedAsync(currentUser.UserId, conversationId, Context.ConnectionAborted);

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .BuzzReceived(conversationId, currentUser.UserId, DateTimeOffset.UtcNow);
    }

    public async Task StartCall(Guid conversationId, string callType = "audio")
    {
        await EnsureMembershipAsync(conversationId);
        var roomName = $"conv_{conversationId}";
        await Clients.Group(ConversationGroup(conversationId))
            .CallStarted(conversationId, currentUser.UserId, roomName, callType);
    }

    public async Task EndCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        await Clients.Group(ConversationGroup(conversationId))
            .CallEnded(conversationId, currentUser.UserId);
    }

    public async Task JoinCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        await Clients.Group(ConversationGroup(conversationId))
            .ParticipantJoined(conversationId, currentUser.UserId);
    }

    public async Task LeaveCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        await Clients.Group(ConversationGroup(conversationId))
            .ParticipantLeft(conversationId, currentUser.UserId);
    }

    private async Task EnsureMembershipAsync(Guid conversationId)
    {
        var conversation = await conversationRepository.GetAsync(
            conversationId,
            Context.ConnectionAborted);

        if (conversation is null)
        {
            throw new HubException("Conversation was not found.");
        }

        var userId = currentUser.UserId;
        if (!conversation.HasMember(userId))
        {
            throw new HubException("Unauthorized: Not a member of this conversation.");
        }
    }

    public static string ConversationGroup(Guid id) => $"conversation:{id:N}";
    public static string UserGroup(Guid id) => $"user:{id:N}";
}
