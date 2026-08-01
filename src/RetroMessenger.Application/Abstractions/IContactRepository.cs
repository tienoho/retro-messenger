using RetroMessenger.Contracts.Contacts;

namespace RetroMessenger.Application.Abstractions;

public interface IContactRepository
{
    Task<IReadOnlyCollection<FriendDto>> GetContactsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<FriendRequestDto>> GetPendingRequestsAsync(Guid recipientId, CancellationToken cancellationToken = default);
    Task<ContactRequestStateDto> GetRequestStateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<BlockedContactDto>> GetBlockedContactsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FriendRequestDto> AddRequestAsync(Guid senderId, string targetUsername, CancellationToken cancellationToken = default);
    Task AcceptRequestAsync(Guid requestId, Guid recipientId, CancellationToken cancellationToken = default);
    Task RejectRequestAsync(Guid requestId, Guid recipientId, CancellationToken cancellationToken = default);
    Task CancelRequestAsync(Guid requestId, Guid senderId, CancellationToken cancellationToken = default);
    Task<BlockedContactDto> BlockAsync(Guid userId, Guid targetUserId, CancellationToken cancellationToken = default);
    Task UnblockAsync(Guid userId, Guid targetUserId, CancellationToken cancellationToken = default);
    Task<bool> IsBlockedPairAsync(Guid firstUserId, Guid secondUserId, CancellationToken cancellationToken = default);
}
