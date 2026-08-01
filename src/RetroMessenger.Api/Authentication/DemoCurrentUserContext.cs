using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure.Persistence;

namespace RetroMessenger.Api.Authentication;

public sealed class DemoCurrentUserContext : ICurrentUserContext
{
    public Guid UserId => DemoData.CurrentUser.Id;

    public Guid DeviceId { get; } =
        Guid.Parse("33333333-3333-3333-3333-333333333333");

    public bool IsAuthenticated => true;
}
