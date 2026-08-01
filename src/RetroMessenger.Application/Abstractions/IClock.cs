namespace RetroMessenger.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
