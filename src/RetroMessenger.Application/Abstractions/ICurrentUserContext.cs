namespace RetroMessenger.Application.Abstractions;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    Guid DeviceId { get; }
    bool IsAuthenticated { get; }
}
