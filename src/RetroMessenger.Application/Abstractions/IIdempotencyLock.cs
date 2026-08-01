namespace RetroMessenger.Application.Abstractions;

public interface IIdempotencyLock
{
    ValueTask<IAsyncDisposable> AcquireAsync(
        string key,
        CancellationToken cancellationToken);
}
