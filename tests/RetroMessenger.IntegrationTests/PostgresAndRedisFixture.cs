using Microsoft.EntityFrameworkCore;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Entities;
using StackExchange.Redis;
using Testcontainers.PostgreSql;
using Testcontainers.Redis;
using Xunit;

namespace RetroMessenger.IntegrationTests;

public sealed class PostgresAndRedisFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer? _postgresContainer;
    private readonly RedisContainer? _redisContainer;

    public bool IsUsingRealContainers { get; private set; }
    public string PostgresConnectionString { get; private set; } = string.Empty;
    public string RedisConnectionString { get; private set; } = string.Empty;
    public IConnectionMultiplexer? RedisMultiplexer { get; private set; }

    public PostgresAndRedisFixture()
    {
        try
        {
            _postgresContainer = new PostgreSqlBuilder()
                .WithImage("postgres:16-alpine")
                .WithDatabase("retromessenger_test")
                .WithUsername("postgres")
                .WithPassword("postgres")
                .Build();

            _redisContainer = new RedisBuilder()
                .WithImage("redis:7-alpine")
                .Build();
        }
        catch
        {
            // Container builders optional if environment lacks container runtime
        }
    }

    public async Task InitializeAsync()
    {
        if (_postgresContainer is not null && _redisContainer is not null)
        {
            try
            {
                await _postgresContainer.StartAsync();
                await _redisContainer.StartAsync();

                PostgresConnectionString = _postgresContainer.GetConnectionString();
                RedisConnectionString = _redisContainer.GetConnectionString();
                RedisMultiplexer = await ConnectionMultiplexer.ConnectAsync(RedisConnectionString);
                IsUsingRealContainers = true;
            }
            catch
            {
                IsUsingRealContainers = false;
            }
        }

        if (IsUsingRealContainers && !string.IsNullOrEmpty(PostgresConnectionString))
        {
            var options = new DbContextOptionsBuilder<MessengerDbContext>()
                .UseNpgsql(PostgresConnectionString)
                .Options;

            using var db = new MessengerDbContext(options);
            await db.Database.ExecuteSqlRawAsync("""
                CREATE SCHEMA IF NOT EXISTS chat;
                CREATE SCHEMA IF NOT EXISTS users;
                """);
            await db.Database.EnsureCreatedAsync();
        }
    }

    public MessengerDbContext CreateDbContext(string? dbName = null)
    {
        if (IsUsingRealContainers && !string.IsNullOrEmpty(PostgresConnectionString))
        {
            var options = new DbContextOptionsBuilder<MessengerDbContext>()
                .UseNpgsql(PostgresConnectionString)
                .Options;
            return new MessengerDbContext(options);
        }
        else
        {
            var options = new DbContextOptionsBuilder<MessengerDbContext>()
                .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
                .Options;
            var db = new MessengerDbContext(options);
            db.Database.EnsureCreated();
            return db;
        }
    }

    public static void AddUserProfiles(MessengerDbContext db, params Guid[] userIds)
    {
        foreach (var userId in userIds.Distinct())
        {
            db.Profiles.Add(new UserProfileEntity
            {
                Id = userId,
                Username = $"test_{userId:N}",
                DisplayName = $"Test User {userId:N}",
                Status = "online"
            });
        }
    }

    public async Task DisposeAsync()
    {
        if (RedisMultiplexer is not null)
        {
            await RedisMultiplexer.DisposeAsync();
        }

        if (_postgresContainer is not null)
        {
            await _postgresContainer.DisposeAsync();
        }

        if (_redisContainer is not null)
        {
            await _redisContainer.DisposeAsync();
        }
    }
}

[CollectionDefinition("PostgresAndRedis")]
public class PostgresAndRedisTestFixtureDefinition : ICollectionFixture<PostgresAndRedisFixture>
{
}
