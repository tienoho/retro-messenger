using RetroMessenger.Domain.Messaging;
using RetroMessenger.Domain.Users;

namespace RetroMessenger.Infrastructure.Persistence;

public static class DemoData
{
    public static readonly User CurrentUser =
        new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Bạn", "online");

    public static readonly User Friend =
        new(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Hồng Anh", "online");

    public static readonly Guid ConversationId =
        Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public static readonly Conversation Conversation =
        new(ConversationId, "Hồng Anh", [CurrentUser.Id, Friend.Id]);

    public static readonly IReadOnlyList<Message> Messages =
    [
        Message.CreateText(
            ConversationId,
            Friend.Id,
            "seed-1",
            Conversation.NextSequence(),
            "Chào mừng đến với Retro Messenger!",
            DateTimeOffset.UtcNow.AddMinutes(-5)),
        Message.CreateText(
            ConversationId,
            CurrentUser.Id,
            "seed-2",
            Conversation.NextSequence(),
            "Đây là luồng chat in-memory có SignalR.",
            DateTimeOffset.UtcNow.AddMinutes(-4))
    ];
}
