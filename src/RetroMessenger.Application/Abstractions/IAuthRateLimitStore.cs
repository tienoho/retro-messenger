namespace RetroMessenger.Application.Abstractions;

public sealed record AuthRateLimitDecision(bool IsAllowed, TimeSpan RetryAfter);

public interface IAuthRateLimitStore
{
    Task<AuthRateLimitDecision> TryAcquireAsync(
        string partitionKey,
        int permitLimit,
        TimeSpan window,
        CancellationToken cancellationToken = default);
}
