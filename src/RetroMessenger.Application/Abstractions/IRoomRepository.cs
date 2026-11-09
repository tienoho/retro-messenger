using RetroMessenger.Contracts.Rooms;

namespace RetroMessenger.Application.Abstractions;

public interface IRoomRepository
{
    Task<IReadOnlyCollection<RoomDto>> GetPublicRoomsAsync(CancellationToken cancellationToken = default);
    Task<RoomDto> CreateRoomAsync(string title, string description, bool isPublic, Guid ownerId, CancellationToken cancellationToken = default);
    Task<bool> JoinRoomAsync(Guid roomId, Guid userId, CancellationToken cancellationToken = default);
}
