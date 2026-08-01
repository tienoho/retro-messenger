using Microsoft.Extensions.Logging;
using RetroMessenger.Application.Abstractions;
using StackExchange.Redis;

namespace RetroMessenger.Infrastructure.Redis;

#pragma warning disable CA1848
public sealed class RedisAuthRateLimitStore(
    IServiceProvider serviceProvider,
    ILogger<RedisAuthRateLimitStore> logger) : IAuthRateLimitStore
{
    private const string IncrementScript = """
        local current = redis.call('INCR', KEYS[1])
        if current == 1 then
            redis.call('EXPIRE', KEYS[1], ARGV[1])
        end
        local ttl = redis.call('TTL', KEYS[1])
        return {current, ttl}
        """;

    public async Task<AuthRateLimitDecision> TryAcquireAsync(
        string partitionKey,
        int permitLimit,
        TimeSpan window,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;
        var multiplexer = serviceProvider.GetService(typeof(IConnectionMultiplexer))
            as IConnectionMultiplexer;
        if (multiplexer is null || !multiplexer.IsConnected)
        {
            return new AuthRateLimitDecision(true, TimeSpan.Zero);
        }

        var windowSeconds = Math.Max(1, (long)Math.Ceiling(window.TotalSeconds));
        var bucket = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / windowSeconds;
        var redisKey = (RedisKey)$"retro:auth-rate:{partitionKey}:{bucket}";

        try
        {
            var result = (RedisResult[]?)await multiplexer.GetDatabase().ScriptEvaluateAsync(
                IncrementScript,
                [redisKey],
                [windowSeconds]);
            if (result is null || result.Length != 2)
            {
                return new AuthRateLimitDecision(true, TimeSpan.Zero);
            }

            var count = (long)result[0];
            var ttlSeconds = Math.Max(1, (long)result[1]);
            return new AuthRateLimitDecision(
                count <= permitLimit,
                TimeSpan.FromSeconds(ttlSeconds));
        }
        catch (RedisException exception)
        {
            logger.LogWarning(
                exception,
                "Distributed auth rate limiter is unavailable; local limiter remains active.");
            return new AuthRateLimitDecision(true, TimeSpan.Zero);
        }
    }
}
