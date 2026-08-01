using StackExchange.Redis;

namespace RetroMessenger.Infrastructure.Redis;

public interface IPresenceService
{
    Task SetUserOnlineAsync(Guid userId, Guid deviceId, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task SetUserOfflineAsync(Guid userId, Guid deviceId, CancellationToken cancellationToken = default);
    Task SetTypingAsync(Guid conversationId, Guid userId, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task ClearTypingAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsUserOnlineAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class RedisPresenceService(IConnectionMultiplexer redis) : IPresenceService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task SetUserOnlineAsync(Guid userId, Guid deviceId, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var userKey = $"presence:user:{userId:N}";
        var deviceKey = $"presence:device:{deviceId:N}";

        await _db.StringSetAsync(userKey, "online", ttl);
        await _db.StringSetAsync(deviceKey, "online", ttl);
    }

    public async Task SetUserOfflineAsync(Guid userId, Guid deviceId, CancellationToken cancellationToken = default)
    {
        var userKey = $"presence:user:{userId:N}";
        var deviceKey = $"presence:device:{deviceId:N}";

        await _db.KeyDeleteAsync(userKey);
        await _db.KeyDeleteAsync(deviceKey);
    }

    public async Task SetTypingAsync(Guid conversationId, Guid userId, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var typingKey = $"typing:{conversationId:N}:{userId:N}";
        await _db.StringSetAsync(typingKey, "typing", ttl);
    }

    public async Task ClearTypingAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var typingKey = $"typing:{conversationId:N}:{userId:N}";
        await _db.KeyDeleteAsync(typingKey);
    }

    public async Task<bool> IsUserOnlineAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var userKey = $"presence:user:{userId:N}";
        return await _db.KeyExistsAsync(userKey);
    }
}
