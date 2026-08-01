using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using RetroMessenger.Api.Security;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Infrastructure;
using RetroMessenger.Infrastructure.Authentication;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Redis;
using Xunit;

namespace RetroMessenger.IntegrationTests;

[Collection("PostgresAndRedis")]
public sealed class AuthHardeningIntegrationTests(PostgresAndRedisFixture fixture)
{
    private const string SigningKey =
        "auth-hardening-test-signing-key-with-at-least-thirty-two-bytes";

    [Fact]
    public async Task AccessTokenFamilyIsRejectedAfterLogoutExpiryOrAccountLockout()
    {
        Assert.True(fixture.IsUsingRealContainers);
        await using var provider = CreateProvider();
        using var scope = provider.CreateScope();
        var identity = scope.ServiceProvider.GetRequiredService<IIdentityService>();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var validator = scope.ServiceProvider.GetRequiredService<IAccessTokenSessionValidator>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetRequiredService<MessengerDbContext>();
        var username = $"auth_{Guid.NewGuid():N}";
        var (registered, _, userId) = await identity.RegisterUserAsync(
            username,
            "Auth Hardening",
            "CorrectPassword1!");
        Assert.True(registered);
        await userRepository.CreateAsync(userId, username, "Auth Hardening");

        var (accessToken, refreshToken) = await identity.GenerateTokensAsync(userId, username);
        var familyId = ReadFamilyId(accessToken);
        Assert.True(await validator.IsActiveAsync(userId, familyId));

        await identity.RevokeTokenAsync(refreshToken);
        Assert.False(await validator.IsActiveAsync(userId, familyId));

        var (secondAccessToken, _) = await identity.GenerateTokensAsync(userId, username);
        var secondFamilyId = ReadFamilyId(secondAccessToken);
        Assert.True(await validator.IsActiveAsync(userId, secondFamilyId));

        var user = await userManager.FindByIdAsync(userId.ToString());
        Assert.NotNull(user);
        Assert.True((await userManager.SetLockoutEndDateAsync(
            user,
            DateTimeOffset.UtcNow.AddMinutes(15))).Succeeded);
        Assert.False(await validator.IsActiveAsync(userId, secondFamilyId));

        Assert.True((await userManager.SetLockoutEndDateAsync(user, null)).Succeeded);
        Assert.True(await validator.IsActiveAsync(userId, secondFamilyId));

        await db.RefreshSessions
            .Where(x => x.FamilyId == secondFamilyId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.ExpiresAt, DateTimeOffset.UtcNow.AddMinutes(-1)));
        Assert.False(await validator.IsActiveAsync(userId, secondFamilyId));
    }

    [Fact]
    public async Task InvalidCredentialsUseGenericErrorsAndTriggerAccountLockout()
    {
        Assert.True(fixture.IsUsingRealContainers);
        await using var provider = CreateProvider();
        using var scope = provider.CreateScope();
        var identity = scope.ServiceProvider.GetRequiredService<IIdentityService>();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var username = $"lockout_{Guid.NewGuid():N}";
        var (registered, _, userId) = await identity.RegisterUserAsync(
            username,
            "Lockout Test",
            "CorrectPassword1!");
        Assert.True(registered);
        await userRepository.CreateAsync(userId, username, "Lockout Test");

        var missing = await identity.ValidateUserCredentialsAsync(
            $"missing_{Guid.NewGuid():N}",
            "WrongPassword");
        var wrong = await identity.ValidateUserCredentialsAsync(username, "WrongPassword");
        Assert.False(missing.Succeeded);
        Assert.False(wrong.Succeeded);
        Assert.Equal(missing.Errors, wrong.Errors);
        Assert.Equal("Invalid username or password.", Assert.Single(wrong.Errors));

        for (var attempt = 1; attempt < 5; attempt++)
        {
            Assert.False((await identity.ValidateUserCredentialsAsync(
                username,
                "WrongPassword")).Succeeded);
        }

        Assert.False((await identity.ValidateUserCredentialsAsync(
            username,
            "CorrectPassword1!")).Succeeded);
        var user = await userManager.FindByIdAsync(userId.ToString());
        Assert.NotNull(user);
        Assert.True(await userManager.IsLockedOutAsync(user));
    }

    [Fact]
    public void InvalidRateLimitConfigurationFailsAtStartup()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"{AuthRateLimitOptions.SectionName}:LoginPermitLimit"] = "0"
            })
            .Build();
        var services = new ServiceCollection();

        var exception = Assert.Throws<InvalidOperationException>(() =>
            services.AddAuthRateLimiting(configuration));

        Assert.Contains(AuthRateLimitOptions.SectionName, exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task RedisRateLimitStoreCoordinatesCountersAcrossInstances()
    {
        Assert.True(fixture.IsUsingRealContainers);
        Assert.NotNull(fixture.RedisMultiplexer);
        var services = new ServiceCollection();
        services.AddSingleton(fixture.RedisMultiplexer);
        await using var provider = services.BuildServiceProvider();
        var firstStore = new RedisAuthRateLimitStore(
            provider,
            NullLogger<RedisAuthRateLimitStore>.Instance);
        var secondStore = new RedisAuthRateLimitStore(
            provider,
            NullLogger<RedisAuthRateLimitStore>.Instance);
        var partition = $"test:{Guid.NewGuid():N}";

        var first = await firstStore.TryAcquireAsync(partition, 2, TimeSpan.FromSeconds(30));
        var second = await secondStore.TryAcquireAsync(partition, 2, TimeSpan.FromSeconds(30));
        var rejected = await firstStore.TryAcquireAsync(partition, 2, TimeSpan.FromSeconds(30));

        Assert.True(first.IsAllowed);
        Assert.True(second.IsAllowed);
        Assert.False(rejected.IsAllowed);
        Assert.True(rejected.RetryAfter > TimeSpan.Zero);
    }

    private ServiceProvider CreateProvider()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:postgres"] = fixture.PostgresConnectionString,
                [$"{JwtOptions.SectionName}:SigningKey"] = SigningKey,
                [$"{JwtOptions.SectionName}:Issuer"] = "retro-messenger-tests",
                [$"{JwtOptions.SectionName}:Audience"] = "retro-messenger-test-clients"
            })
            .Build();
        var services = new ServiceCollection();
        services.AddRetroMessengerInfrastructure(configuration);
        return services.BuildServiceProvider();
    }

    private static Guid ReadFamilyId(string accessToken)
    {
        var token = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
        return Guid.Parse(token.Claims.Single(x => x.Type == "token_family").Value);
    }
}
