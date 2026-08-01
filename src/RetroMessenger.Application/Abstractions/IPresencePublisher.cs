namespace RetroMessenger.Application.Abstractions;

public interface IPresencePublisher
{
    Task PublishAsync(
        Guid userId,
        string status,
        string? customStatus,
        DateTimeOffset occurredAt,
        CancellationToken cancellationToken = default);
}
