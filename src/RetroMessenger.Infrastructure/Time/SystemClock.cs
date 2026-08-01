using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
