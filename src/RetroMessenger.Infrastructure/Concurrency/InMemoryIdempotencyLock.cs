using System.Collections.Concurrent;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Concurrency;

public sealed class InMemoryIdempotencyLock : IIdempotencyLock
{
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public async ValueTask<IAsyncDisposable> AcquireAsync(
        string key,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);

        var gate = _locks.GetOrAdd(
            key,
            static _ => new SemaphoreSlim(1, 1));

        await gate.WaitAsync(cancellationToken);
        return new Releaser(gate);
    }

    private sealed class Releaser(SemaphoreSlim gate) : IAsyncDisposable
    {
        private SemaphoreSlim? _gate = gate;

        public ValueTask DisposeAsync()
        {
            Interlocked.Exchange(ref _gate, null)?.Release();
            return ValueTask.CompletedTask;
        }
    }
}
