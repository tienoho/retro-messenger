using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Contacts;

namespace RetroMessenger.Application.Contacts;

public sealed class ContactService(IContactRepository contactRepo)
{
    public async Task<IReadOnlyCollection<FriendDto>> GetFriendsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await contactRepo.GetContactsAsync(userId, cancellationToken);
    }

    public async Task<FriendRequestDto> SendFriendRequestAsync(Guid senderId, SendFriendRequest request, CancellationToken cancellationToken = default)
    {
        return await contactRepo.AddRequestAsync(senderId, request.TargetUsername.Trim(), cancellationToken);
    }

    public Task<IReadOnlyCollection<FriendRequestDto>> GetPendingRequestsAsync(
        Guid recipientId,
        CancellationToken cancellationToken = default) =>
        contactRepo.GetPendingRequestsAsync(recipientId, cancellationToken);

    public Task<ContactRequestStateDto> GetRequestStateAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        contactRepo.GetRequestStateAsync(userId, cancellationToken);

    public Task<IReadOnlyCollection<BlockedContactDto>> GetBlockedContactsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        contactRepo.GetBlockedContactsAsync(userId, cancellationToken);

    public async Task AcceptFriendRequestAsync(
        Guid requestId,
        Guid recipientId,
        CancellationToken cancellationToken = default)
    {
        await contactRepo.AcceptRequestAsync(requestId, recipientId, cancellationToken);
    }

    public Task RejectFriendRequestAsync(Guid requestId, Guid recipientId, CancellationToken cancellationToken = default) =>
        contactRepo.RejectRequestAsync(requestId, recipientId, cancellationToken);

    public Task CancelFriendRequestAsync(Guid requestId, Guid senderId, CancellationToken cancellationToken = default) =>
        contactRepo.CancelRequestAsync(requestId, senderId, cancellationToken);

    public Task<BlockedContactDto> BlockAsync(Guid userId, Guid targetUserId, CancellationToken cancellationToken = default) =>
        contactRepo.BlockAsync(userId, targetUserId, cancellationToken);

    public Task UnblockAsync(Guid userId, Guid targetUserId, CancellationToken cancellationToken = default) =>
        contactRepo.UnblockAsync(userId, targetUserId, cancellationToken);
}
