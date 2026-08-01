using Microsoft.EntityFrameworkCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Rooms;
using RetroMessenger.Infrastructure.Persistence.Entities;

namespace RetroMessenger.Infrastructure.Persistence.Repositories;

public sealed class PostgresRoomRepository(MessengerDbContext db) : IRoomRepository
{
    public async Task<IReadOnlyCollection<RoomDto>> GetPublicRoomsAsync(CancellationToken cancellationToken = default)
    {
        var rooms = await db.Rooms.AsNoTracking().Where(r => r.IsPublic).ToListAsync(cancellationToken);
        if (rooms.Count == 0)
        {
            return new List<RoomDto>
            {
                new(Guid.Parse("88888888-8888-8888-8888-888888888888"), "Phòng Lập Trình & Công Nghệ", "Thảo luận lập trình .NET & React", 42, true),
                new(Guid.Parse("99999999-9999-9999-9999-999999999999"), "Phòng Trò Chuyện Lời Nhắn Nhớ", "Giao lưu thành viên Yahoo Messenger", 128, true)
            };
        }

        return rooms.Select(r => new RoomDto(r.Id, r.Title, r.Description, r.MemberCount, r.IsPublic)).ToList();
    }

    public async Task<RoomDto> CreateRoomAsync(string title, string description, bool isPublic, CancellationToken cancellationToken = default)
    {
        var entity = new RoomEntity
        {
            Id = Guid.CreateVersion7(),
            Title = title,
            Description = description,
            IsPublic = isPublic,
            MemberCount = 1,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Rooms.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return new RoomDto(entity.Id, entity.Title, entity.Description, entity.MemberCount, entity.IsPublic);
    }
}
