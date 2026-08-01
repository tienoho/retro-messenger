namespace RetroMessenger.Contracts.Rooms;

public sealed record RoomDto(
    Guid Id,
    string Title,
    string Description,
    int MemberCount,
    bool IsPublic);

public sealed record CreateRoomRequest(string Title, string Description, bool IsPublic);
