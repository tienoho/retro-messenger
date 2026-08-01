using RetroMessenger.Contracts.Messaging;

namespace RetroMessenger.Application.Abstractions;

public interface IRealtimePublisher
{
    Task PublishMessageAsync(MessageDto message, CancellationToken cancellationToken);
    Task PublishCallStartedAsync(Guid conversationId, Guid initiatorId, string roomName, string callType, CancellationToken cancellationToken);
    Task PublishCallEndedAsync(Guid conversationId, Guid endedById, CancellationToken cancellationToken);
    Task PublishParticipantJoinedAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken);
    Task PublishParticipantLeftAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken);
}
