using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Api.Security;

public sealed class AuthRateLimitOptions
{
    public const string SectionName = "Authentication:RateLimit";

    public int LoginPermitLimit { get; set; } = 10;
    public int LoginWindowSeconds { get; set; } = 60;
    public int RegisterPermitLimit { get; set; } = 5;
    public int RegisterWindowSeconds { get; set; } = 3600;
    public int TokenPermitLimit { get; set; } = 30;
    public int TokenWindowSeconds { get; set; } = 60;
    public int ContactMutationPermitLimit { get; set; } = 20;
    public int ContactMutationWindowSeconds { get; set; } = 60;
}

public static class AuthRateLimitPolicies
{
    public const string Login = "auth-login";
    public const string Register = "auth-register";
    public const string Token = "auth-token";
    public const string ContactMutation = "contact-mutation";

    public static IServiceCollection AddAuthRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var configured = configuration
            .GetSection(AuthRateLimitOptions.SectionName)
            .Get<AuthRateLimitOptions>() ?? new AuthRateLimitOptions();
        Validate(configured);
        services.Configure<AuthRateLimitOptions>(
            configuration.GetSection(AuthRateLimitOptions.SectionName));

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(
                        MetadataName.RetryAfter,
                        out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
                            .ToString(CultureInfo.InvariantCulture);
                }

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too many authentication requests.",
                    Type = "https://errors.retromessenger.local/auth_rate_limited",
                    Instance = context.HttpContext.Request.Path
                };
                problem.Extensions["code"] = "AUTH_RATE_LIMITED";
                problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    problem,
                    cancellationToken);
            };

            options.AddPolicy(Login, context => CreatePartition(
                context,
                configured.LoginPermitLimit,
                configured.LoginWindowSeconds));
            options.AddPolicy(Register, context => CreatePartition(
                context,
                configured.RegisterPermitLimit,
                configured.RegisterWindowSeconds));
            options.AddPolicy(Token, context => CreatePartition(
                context,
                configured.TokenPermitLimit,
                configured.TokenWindowSeconds));
            options.AddPolicy(ContactMutation, context => CreatePartition(
                context,
                configured.ContactMutationPermitLimit,
                configured.ContactMutationWindowSeconds));
        });

        return services;
    }

    private static RateLimitPartition<string> CreatePartition(
        HttpContext context,
        int permitLimit,
        int windowSeconds) =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = permitLimit,
                QueueLimit = 0,
                Window = TimeSpan.FromSeconds(windowSeconds)
            });

    private static void Validate(AuthRateLimitOptions options)
    {
        if (options.LoginPermitLimit <= 0 || options.LoginWindowSeconds <= 0 ||
            options.RegisterPermitLimit <= 0 || options.RegisterWindowSeconds <= 0 ||
            options.TokenPermitLimit <= 0 || options.TokenWindowSeconds <= 0 ||
            options.ContactMutationPermitLimit <= 0 || options.ContactMutationWindowSeconds <= 0)
        {
            throw new InvalidOperationException(
                $"{AuthRateLimitOptions.SectionName} limits and windows must be positive.");
        }
    }

    public static RouteHandlerBuilder RequireAuthRateLimiting(
        this RouteHandlerBuilder builder,
        string policyName)
    {
        builder.RequireRateLimiting(policyName);
        return builder.AddEndpointFilter(new DistributedAuthRateLimitFilter(policyName));
    }

    private sealed class DistributedAuthRateLimitFilter(string policyName) : IEndpointFilter
    {
        public async ValueTask<object?> InvokeAsync(
            EndpointFilterInvocationContext context,
            EndpointFilterDelegate next)
        {
            var httpContext = context.HttpContext;
            var options = httpContext.RequestServices
                .GetRequiredService<IOptions<AuthRateLimitOptions>>()
                .Value;
            var store = httpContext.RequestServices
                .GetRequiredService<IAuthRateLimitStore>();
            var (permitLimit, windowSeconds) = policyName switch
            {
                Login => (options.LoginPermitLimit, options.LoginWindowSeconds),
                Register => (options.RegisterPermitLimit, options.RegisterWindowSeconds),
                Token => (options.TokenPermitLimit, options.TokenWindowSeconds),
                ContactMutation => (options.ContactMutationPermitLimit, options.ContactMutationWindowSeconds),
                _ => throw new InvalidOperationException($"Unknown auth rate-limit policy '{policyName}'.")
            };
            var clientAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var addressHash = Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(clientAddress)))[..24];
            var decision = await store.TryAcquireAsync(
                $"{policyName}:{addressHash}",
                permitLimit,
                TimeSpan.FromSeconds(windowSeconds),
                httpContext.RequestAborted);
            if (decision.IsAllowed)
            {
                return await next(context);
            }

            httpContext.Response.Headers.RetryAfter = Math.Max(
                1,
                (int)Math.Ceiling(decision.RetryAfter.TotalSeconds))
                .ToString(CultureInfo.InvariantCulture);
            return Results.Problem(
                statusCode: StatusCodes.Status429TooManyRequests,
                title: "Too many authentication requests.",
                type: "https://errors.retromessenger.local/auth_rate_limited",
                instance: httpContext.Request.Path,
                extensions: new Dictionary<string, object?>
                {
                    ["code"] = "AUTH_RATE_LIMITED",
                    ["traceId"] = httpContext.TraceIdentifier
                });
        }
    }
}
