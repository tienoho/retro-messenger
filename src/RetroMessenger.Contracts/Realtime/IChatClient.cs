using RetroMessenger.Contracts.Messaging;

namespace RetroMessenger.Contracts.Realtime;

public interface IChatClient
{
    Task MessageReceived(MessageDto message);
    Task MessageRead(Guid conversationId, Guid readerId, long sequence, DateTimeOffset readAt);
    Task TypingChanged(Guid conversationId, Guid userId, bool isTyping);
    Task BuzzReceived(Guid conversationId, Guid senderId, DateTimeOffset sentAt);
    Task PresenceChanged(Guid userId, string status, string? customStatus, DateTimeOffset occurredAt);
    Task CallStarted(Guid conversationId, Guid initiatorId, string roomName, string callType);
    Task CallEnded(Guid conversationId, Guid endedById);
    Task ParticipantJoined(Guid conversationId, Guid userId);
    Task ParticipantLeft(Guid conversationId, Guid userId);
    Task CallOfferReceived(Guid conversationId, Guid senderId, string sdp);
    Task CallAnswerReceived(Guid conversationId, Guid senderId, string sdp);
    Task IceCandidateReceived(Guid conversationId, Guid senderId, string candidate, string? sdpMid, int? sdpMLineIndex);
}
