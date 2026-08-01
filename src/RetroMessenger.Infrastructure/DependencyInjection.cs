using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenIddict.Validation.AspNetCore;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Infrastructure.Authentication;
using RetroMessenger.Infrastructure.Concurrency;
using RetroMessenger.Infrastructure.Persistence;
using RetroMessenger.Infrastructure.Persistence.Outbox;
using RetroMessenger.Infrastructure.Persistence.Repositories;
using RetroMessenger.Infrastructure.Redis;
using RetroMessenger.Infrastructure.Time;
using StackExchange.Redis;

namespace RetroMessenger.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddRetroMessengerInfrastructure(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        return AddRetroMessengerInfrastructureCore(
            services,
            configuration,
            includeApiServices: true);
    }

    public static IServiceCollection AddRetroMessengerWorkerInfrastructure(
        this IServiceCollection services,
        IConfiguration? configuration = null)
    {
        return AddRetroMessengerInfrastructureCore(
            services,
            configuration,
            includeApiServices: false);
    }

    private static IServiceCollection AddRetroMessengerInfrastructureCore(
        IServiceCollection services,
        IConfiguration? configuration,
        bool includeApiServices)
    {
        services.AddLogging();

        var connectionString = configuration?.GetConnectionString("postgres")
            ?? configuration?["ConnectionStrings:postgres"]
            ?? configuration?["PostgreSQL:ConnectionString"];

        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<MessengerDbContext>(options =>
            {
                options.UseNpgsql(connectionString);
                options.UseOpenIddict<Guid>();
            });

            services.AddScoped<IConversationRepository, PostgresConversationRepository>();
            services.AddScoped<IMessageRepository, PostgresMessageRepository>();
            services.AddScoped<IUserRepository, PostgresUserRepository>();
            services.AddScoped<IContactRepository, PostgresContactRepository>();
            services.AddScoped<IRoomRepository, PostgresRoomRepository>();
            services.AddScoped<IAttachmentRepository, PostgresAttachmentRepository>();
            services.AddScoped<IAdminRepository, PostgresAdminRepository>();
            if (includeApiServices)
            {
                services.AddScoped<IAccessTokenSessionValidator, AccessTokenSessionValidator>();
                services.AddHostedService<OutboxProcessorWorker>();
            }
        }
        else
        {
            services.AddDbContext<MessengerDbContext>(options =>
            {
                options.UseInMemoryDatabase("RetroMessengerDb");
                options.UseOpenIddict<Guid>();
            });

            services.AddScoped<IConversationRepository, PostgresConversationRepository>();
            services.AddScoped<IMessageRepository, PostgresMessageRepository>();
            services.AddScoped<IUserRepository, PostgresUserRepository>();
            services.AddScoped<IContactRepository, PostgresContactRepository>();
            services.AddScoped<IRoomRepository, PostgresRoomRepository>();
            services.AddScoped<IAttachmentRepository, PostgresAttachmentRepository>();
            services.AddScoped<IAdminRepository, PostgresAdminRepository>();
            if (includeApiServices)
            {
                services.AddHostedService<OutboxProcessorWorker>();
            }
        }

        if (includeApiServices)
        {
            var jwtSigningKey = configuration?[$"{JwtOptions.SectionName}:SigningKey"];
            if (string.IsNullOrWhiteSpace(jwtSigningKey) ||
                Encoding.UTF8.GetByteCount(jwtSigningKey) < 32)
            {
                throw new InvalidOperationException(
                    $"{JwtOptions.SectionName}:SigningKey must contain at least 32 UTF-8 bytes.");
            }

            var accessTokenLifetimeMinutes = configuration?.GetValue<int?>(
                $"{JwtOptions.SectionName}:AccessTokenLifetimeMinutes") ?? 60;
            var refreshTokenLifetimeDays = configuration?.GetValue<int?>(
                $"{JwtOptions.SectionName}:RefreshTokenLifetimeDays") ?? 30;
            var issuer = configuration?[$"{JwtOptions.SectionName}:Issuer"]
                ?? "retro-messenger";
            var audience = configuration?[$"{JwtOptions.SectionName}:Audience"]
                ?? "retro-messenger-clients";
            if (string.IsNullOrWhiteSpace(issuer) || string.IsNullOrWhiteSpace(audience))
            {
                throw new InvalidOperationException(
                    $"{JwtOptions.SectionName}:Issuer and Audience are required.");
            }
            services.Configure<JwtOptions>(options =>
            {
                options.SigningKey = jwtSigningKey;
                options.Issuer = issuer;
                options.Audience = audience;
                options.AccessTokenLifetimeMinutes = accessTokenLifetimeMinutes;
                options.RefreshTokenLifetimeDays = refreshTokenLifetimeDays;
            });

            services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = false;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<MessengerDbContext>()
            .AddDefaultTokenProviders();

            services.AddOpenIddict()
                .AddCore(options =>
                {
                    options.UseEntityFrameworkCore()
                           .UseDbContext<MessengerDbContext>();
                })
                .AddServer(options =>
                {
                    options.SetAuthorizationEndpointUris("/connect/authorize")
                           .SetTokenEndpointUris("/connect/token")
                           .SetLogoutEndpointUris("/connect/logout")
                           .SetRevocationEndpointUris("/connect/revocation");

                    options.AllowAuthorizationCodeFlow()
                           .RequireProofKeyForCodeExchange()
                           .AllowRefreshTokenFlow()
                           .AllowPasswordFlow()
                           .AllowClientCredentialsFlow();

                    options.AddDevelopmentEncryptionCertificate()
                           .AddDevelopmentSigningCertificate();

                    options.UseAspNetCore()
                           .EnableAuthorizationEndpointPassthrough()
                           .EnableTokenEndpointPassthrough()
                           .EnableLogoutEndpointPassthrough()
                           .DisableTransportSecurityRequirement();
                })
                .AddValidation(options =>
                {
                    options.UseLocalServer();
                    options.UseAspNetCore();
                });

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSigningKey)),
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ValidAlgorithms = [Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256],
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var subject = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? context.Principal?.FindFirstValue("sub");
                        var family = context.Principal?.FindFirstValue("token_family");
                        if (!Guid.TryParse(subject, out var userId) ||
                            !Guid.TryParse(family, out var familyId))
                        {
                            context.Fail("Access token session claims are invalid.");
                            return;
                        }

                        var validator = context.HttpContext.RequestServices
                            .GetRequiredService<IAccessTokenSessionValidator>();
                        var active = await validator.IsActiveAsync(
                            userId,
                            familyId,
                            context.HttpContext.RequestAborted);
                        if (!active)
                        {
                            context.Fail("Access token session is no longer active.");
                        }
                    }
                };
            });

            services.AddAuthorization();
        }

        var redisConnection = configuration?.GetConnectionString("redis")
            ?? configuration?["ConnectionStrings:redis"]
            ?? configuration?["Redis:ConnectionString"];

        if (!string.IsNullOrWhiteSpace(redisConnection))
        {
            try
            {
                var multiplexer = ConnectionMultiplexer.Connect(redisConnection);
                services.AddSingleton<IConnectionMultiplexer>(multiplexer);
                services.AddSingleton<IPresenceService, RedisPresenceService>();
            }
            catch
            {
                // Fallback if Redis is offline
            }
        }

        services.Configure<RetroMessenger.Infrastructure.Storage.StorageOptions>(configuration?.GetSection(RetroMessenger.Infrastructure.Storage.StorageOptions.SectionName) ?? new ConfigurationBuilder().Build().GetSection("Storage"));
        services.Configure<RetroMessenger.Infrastructure.Storage.ClamAvOptions>(configuration?.GetSection(RetroMessenger.Infrastructure.Storage.ClamAvOptions.SectionName) ?? new ConfigurationBuilder().Build().GetSection("ClamAv"));
        services.Configure<RetroMessenger.Infrastructure.Storage.FFmpegOptions>(configuration?.GetSection(RetroMessenger.Infrastructure.Storage.FFmpegOptions.SectionName) ?? new ConfigurationBuilder().Build().GetSection("FFmpeg"));
        services.Configure<RetroMessenger.Infrastructure.Calls.LiveKitOptions>(configuration?.GetSection(RetroMessenger.Infrastructure.Calls.LiveKitOptions.SectionName) ?? new ConfigurationBuilder().Build().GetSection("LiveKit"));

        if (includeApiServices)
        {
            services.AddHttpContextAccessor();
            services.AddScoped<IIdentityService, IdentityService>();
            services.AddScoped<ICurrentUserContext, HttpCurrentUserContext>();
            services.AddSingleton<IIdempotencyLock, InMemoryIdempotencyLock>();
            services.AddSingleton<IClock, SystemClock>();
            services.AddScoped<ITransactionRunner, EfTransactionRunner>();
            services.AddScoped<SendMessageService>();
            services.AddScoped<RetroMessenger.Infrastructure.Calls.CallSignalingService>();
        }

        services.AddSingleton<IStorageService, RetroMessenger.Infrastructure.Storage.S3StorageService>();
        services.AddSingleton<IClamAvScanner, RetroMessenger.Infrastructure.Storage.ClamAvScanner>();
        services.AddSingleton<IThumbnailGenerator, RetroMessenger.Infrastructure.Storage.FFmpegThumbnailGenerator>();
        services.AddSingleton<IContentTypeDetector, RetroMessenger.Infrastructure.Storage.ContentTypeDetector>();
        services.AddSingleton<IAuthRateLimitStore, RedisAuthRateLimitStore>();

        return services;
    }
}
