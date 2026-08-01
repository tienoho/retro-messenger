using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Rooms;

namespace RetroMessenger.Application.Rooms;

public sealed class RoomService(IRoomRepository roomRepo)
{
    public async Task<IReadOnlyCollection<RoomDto>> GetPublicRoomsAsync(CancellationToken cancellationToken = default)
    {
        return await roomRepo.GetPublicRoomsAsync(cancellationToken);
    }

    public async Task<RoomDto> CreateRoomAsync(CreateRoomRequest request, CancellationToken cancellationToken = default)
    {
        return await roomRepo.CreateRoomAsync(request.Title.Trim(), request.Description.Trim(), request.IsPublic, cancellationToken);
    }

    public static Task JoinRoomAsync(Guid roomId, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
