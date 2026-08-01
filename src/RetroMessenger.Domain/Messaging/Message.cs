using RetroMessenger.Domain.Common;

namespace RetroMessenger.Domain.Messaging;

public sealed class Message
{
    public Message(
        Guid id,
        Guid conversationId,
        Guid senderId,
        string clientMessageId,
        long sequence,
        MessageType type,
        string content,
        DateTimeOffset createdAt,
        DateTimeOffset? editedAt = null,
        DateTimeOffset? deletedAt = null)
    {
        Id = id;
        ConversationId = conversationId;
        SenderId = senderId;
        ClientMessageId = clientMessageId;
        Sequence = sequence;
        Type = type;
        Content = content;
        CreatedAt = createdAt;
        EditedAt = editedAt;
        DeletedAt = deletedAt;
    }

    public Guid Id { get; }
    public Guid ConversationId { get; }
    public Guid SenderId { get; }
    public string ClientMessageId { get; }
    public long Sequence { get; }
    public MessageType Type { get; }
    public string Content { get; private set; }
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset? EditedAt { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    public static Message CreateText(
        Guid conversationId,
        Guid senderId,
        string clientMessageId,
        long sequence,
        string content,
        DateTimeOffset createdAt)
    {
        if (conversationId == Guid.Empty) throw new DomainException("Conversation is required.");
        if (senderId == Guid.Empty) throw new DomainException("Sender is required.");
        if (string.IsNullOrWhiteSpace(clientMessageId)) throw new DomainException("Client message ID is required.");
        if (string.IsNullOrWhiteSpace(content)) throw new DomainException("Content is required.");
        if (content.Length > 20_000) throw new DomainException("Content exceeds 20,000 characters.");
        if (sequence <= 0) throw new DomainException("Sequence must be positive.");

        return new Message(
            Guid.CreateVersion7(),
            conversationId,
            senderId,
            clientMessageId.Trim(),
            sequence,
            MessageType.Text,
            content.Trim(),
            createdAt);
    }

    public void Edit(string content, DateTimeOffset now)
    {
        if (DeletedAt is not null) throw new DomainException("Deleted message cannot be edited.");
        if (string.IsNullOrWhiteSpace(content)) throw new DomainException("Content is required.");
        if (content.Length > 20_000) throw new DomainException("Content exceeds 20,000 characters.");

        Content = content.Trim();
        EditedAt = now;
    }

    public void Delete(DateTimeOffset now)
    {
        if (DeletedAt is not null) return;
        Content = string.Empty;
        DeletedAt = now;
    }
}
