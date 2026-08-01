using RetroMessenger.Contracts.Rooms;

namespace RetroMessenger.Application.Abstractions;

public interface IRoomRepository
{
    Task<IReadOnlyCollection<RoomDto>> GetPublicRoomsAsync(CancellationToken cancellationToken = default);
    Task<RoomDto> CreateRoomAsync(string title, string description, bool isPublic, CancellationToken cancellationToken = default);
}
