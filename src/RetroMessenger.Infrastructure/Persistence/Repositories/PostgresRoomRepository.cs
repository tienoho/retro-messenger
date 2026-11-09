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

    public async Task<RoomDto> CreateRoomAsync(
        string title,
        string description,
        bool isPublic,
        Guid ownerId,
        CancellationToken cancellationToken = default)
    {
        var roomId = Guid.CreateVersion7();
        var entity = new RoomEntity
        {
            Id = roomId,
            Title = title,
            Description = description,
            OwnerId = ownerId,
            IsPublic = isPublic,
            MemberCount = 1,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Rooms.Add(entity);

        var existingConv = await db.Conversations.FindAsync([roomId], cancellationToken);
        if (existingConv is null)
        {
            db.Conversations.Add(new ConversationEntity
            {
                Id = roomId,
                Title = title,
                ConversationType = 2,
                LastSequence = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
                Members = new List<ConversationMemberEntity>
                {
                    new()
                    {
                        ConversationId = roomId,
                        UserId = ownerId,
                        JoinedAt = DateTimeOffset.UtcNow
                    }
                }
            });
        }

        await db.SaveChangesAsync(cancellationToken);

        return new RoomDto(entity.Id, entity.Title, entity.Description, entity.MemberCount, entity.IsPublic);
    }

    public async Task<bool> JoinRoomAsync(
        Guid roomId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var room = await db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId, cancellationToken);
        var title = room?.Title ?? "Phòng Trò Chuyện";

        var conv = await db.Conversations.Include(c => c.Members).FirstOrDefaultAsync(c => c.Id == roomId, cancellationToken);
        if (conv is null)
        {
            conv = new ConversationEntity
            {
                Id = roomId,
                Title = title,
                ConversationType = 2,
                LastSequence = 0,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Conversations.Add(conv);
        }

        var isMember = await db.ConversationMembers.AnyAsync(m => m.ConversationId == roomId && m.UserId == userId, cancellationToken);
        if (!isMember)
        {
            db.ConversationMembers.Add(new ConversationMemberEntity
            {
                ConversationId = roomId,
                UserId = userId,
                JoinedAt = DateTimeOffset.UtcNow
            });

            if (room is not null)
            {
                room.MemberCount++;
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        return true;
    }
}
