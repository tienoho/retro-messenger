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
    private Guid CurrentUserId =>
        (Guid.TryParse(Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? Context.User?.FindFirst("sub")?.Value
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value, out var id) && id != Guid.Empty)
            ? id
            : currentUser.UserId;

    public override async Task OnConnectedAsync()
    {
        var userId = CurrentUserId;
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

        var userId = CurrentUserId;
        var presence = serviceProvider.GetService<IPresenceService>();
        if (presence is not null)
        {
            await presence.SetTypingAsync(conversationId, userId, TimeSpan.FromSeconds(5));
        }

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .TypingChanged(conversationId, userId, true);
    }

    public async Task StopTyping(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);

        var userId = CurrentUserId;
        var presence = serviceProvider.GetService<IPresenceService>();
        if (presence is not null)
        {
            await presence.ClearTypingAsync(conversationId, userId);
        }

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .TypingChanged(conversationId, userId, false);
    }

    public async Task SendBuzz(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        var senderId = CurrentUserId;
        await buzzService.VerifyBuzzAllowedAsync(senderId, conversationId, Context.ConnectionAborted);

        await Clients.OthersInGroup(ConversationGroup(conversationId))
            .BuzzReceived(conversationId, senderId, DateTimeOffset.UtcNow);

        var conversation = await conversationRepository.GetAsync(conversationId, Context.ConnectionAborted);
        if (conversation is not null)
        {
            foreach (var memberId in conversation.MemberIds.Where(m => m != senderId))
            {
                await Clients.Group(UserGroup(memberId))
                    .BuzzReceived(conversationId, senderId, DateTimeOffset.UtcNow);
            }
        }
    }

    public async Task StartCall(Guid conversationId, string callType = "audio")
    {
        await EnsureMembershipAsync(conversationId);
        var userId = CurrentUserId;
        var roomName = $"conv_{conversationId}";
        await Clients.Group(ConversationGroup(conversationId))
            .CallStarted(conversationId, userId, roomName, callType);

        var conversation = await conversationRepository.GetAsync(conversationId, Context.ConnectionAborted);
        if (conversation is not null)
        {
            foreach (var memberId in conversation.MemberIds.Where(m => m != userId))
            {
                await Clients.Group(UserGroup(memberId))
                    .CallStarted(conversationId, userId, roomName, callType);
            }
        }
    }

    public async Task EndCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        var userId = CurrentUserId;
        await Clients.Group(ConversationGroup(conversationId))
            .CallEnded(conversationId, userId);

        var conversation = await conversationRepository.GetAsync(conversationId, Context.ConnectionAborted);
        if (conversation is not null)
        {
            foreach (var memberId in conversation.MemberIds.Where(m => m != userId))
            {
                await Clients.Group(UserGroup(memberId))
                    .CallEnded(conversationId, userId);
            }
        }
    }

    public async Task JoinCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        var userId = CurrentUserId;
        await Clients.Group(ConversationGroup(conversationId))
            .ParticipantJoined(conversationId, userId);

        var conversation = await conversationRepository.GetAsync(conversationId, Context.ConnectionAborted);
        if (conversation is not null)
        {
            foreach (var memberId in conversation.MemberIds.Where(m => m != userId))
            {
                await Clients.Group(UserGroup(memberId))
                    .ParticipantJoined(conversationId, userId);
            }
        }
    }

    public async Task LeaveCall(Guid conversationId)
    {
        await EnsureMembershipAsync(conversationId);
        var userId = CurrentUserId;
        await Clients.Group(ConversationGroup(conversationId))
            .ParticipantLeft(conversationId, userId);

        var conversation = await conversationRepository.GetAsync(conversationId, Context.ConnectionAborted);
        if (conversation is not null)
        {
            foreach (var memberId in conversation.MemberIds.Where(m => m != userId))
            {
                await Clients.Group(UserGroup(memberId))
                    .ParticipantLeft(conversationId, userId);
            }
        }
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

        var userId = CurrentUserId;
        if (!conversation.HasMember(userId))
        {
            throw new HubException("Unauthorized: Not a member of this conversation.");
        }
    }

    public static string ConversationGroup(Guid id) => $"conversation:{id:N}";
    public static string UserGroup(Guid id) => $"user:{id:N}";
}
