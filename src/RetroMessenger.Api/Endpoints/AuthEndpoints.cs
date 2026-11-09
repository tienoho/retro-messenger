using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using RetroMessenger.Api.Security;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Identity;
using RetroMessenger.Contracts.Authentication;
using static OpenIddict.Abstractions.OpenIddictConstants;

namespace RetroMessenger.Api.Endpoints;

public static class AuthEndpoints
{
    private const string RefreshTokenCookieName = "retro_refresh_token";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/auth").WithTags("Authentication");

        group.MapPost("/login", async (LoginRequest request, AuthService authService, HttpContext context, CancellationToken ct) =>
        {
            var result = await authService.LoginAsync(request, ct);
            SetRefreshTokenCookie(context, result.RefreshToken);
            return Results.Ok(result);
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.Login);

        group.MapPost("/register", async (RegisterRequest request, AuthService authService, HttpContext context, CancellationToken ct) =>
        {
            var result = await authService.RegisterAsync(request, ct);
            SetRefreshTokenCookie(context, result.RefreshToken);
            return Results.Ok(result);
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.Register);

        group.MapPost("/refresh", async (RefreshTokenRequest? request, AuthService authService, HttpContext context, CancellationToken ct) =>
        {
            var token = !string.IsNullOrWhiteSpace(request?.RefreshToken)
                ? request.RefreshToken
                : context.Request.Cookies[RefreshTokenCookieName];

            if (string.IsNullOrWhiteSpace(token))
            {
                return Results.Json(
                    new { error = "unauthorized", message = "No refresh token is available." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var result = await authService.RefreshTokenAsync(new RefreshTokenRequest(token), ct);
            SetRefreshTokenCookie(context, result.RefreshToken);
            return Results.Ok(result);
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.Token);

        group.MapPost("/logout", async (
            RefreshTokenRequest? request,
            AuthService authService,
            HttpContext context,
            CancellationToken ct) =>
        {
            var token = !string.IsNullOrWhiteSpace(request?.RefreshToken)
                ? request.RefreshToken
                : context.Request.Cookies[RefreshTokenCookieName];

            if (!string.IsNullOrWhiteSpace(token))
            {
                await authService.LogoutAsync(new RefreshTokenRequest(token), ct);
            }
            ClearRefreshTokenCookie(context);
            return Results.Ok(new { message = "Logged out successfully." });
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.Token);

        group.MapGet("/session", async (ICurrentUserContext currentUser, IUserRepository userRepo, CancellationToken ct) =>
        {
            var user = await userRepo.GetByIdAsync(currentUser.UserId, ct);
            if (user is null)
            {
                return Results.NotFound();
            }
            return Results.Ok(new SessionDto(user));
        }).RequireAuthorization();

        group.MapPut("/password", async (
            ChangePasswordRequest request,
            ICurrentUserContext currentUser,
            AuthService authService,
            CancellationToken ct) =>
        {
            await authService.ChangePasswordAsync(currentUser.UserId, request, ct);
            return Results.Ok(new { message = "Password changed successfully." });
        }).RequireAuthorization();

        // OpenIddict Connect Endpoints
        endpoints.MapPost("/connect/token", async (HttpContext httpContext, IIdentityService identityService, CancellationToken ct) =>
        {
            var request = httpContext.Features.Get<OpenIddictServerAspNetCoreFeature>()?.Transaction?.Request;
            if (request is null)
            {
                var authHeader = httpContext.Request.Headers.Authorization.ToString();
                if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    var token = authHeader["Bearer ".Length..].Trim();
                    var (succeeded, accessToken, refreshToken, userId, username) = await identityService.RefreshTokenAsync(token, ct);
                    if (succeeded)
                    {
                        return Results.Ok(new { access_token = accessToken, refresh_token = refreshToken, token_type = "Bearer" });
                    }
                }
                return Results.BadRequest(new { error = "invalid_request" });
            }

            if (request.IsPasswordGrantType())
            {
                (bool succeeded, string[] errors, Guid userId) = await identityService.ValidateUserCredentialsAsync(request.Username ?? string.Empty, request.Password ?? string.Empty, ct);
                if (!succeeded)
                {
                    return Results.Challenge(
                        properties: new AuthenticationProperties(new Dictionary<string, string?>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = string.Join(", ", errors)
                        }),
                        authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
                }

                var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
                identity.AddClaim(Claims.Subject, userId.ToString());
                identity.AddClaim(Claims.Name, request.Username ?? string.Empty);

                var principal = new ClaimsPrincipal(identity);
                principal.SetScopes(request.GetScopes());

                return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }
            else if (request.IsRefreshTokenGrantType() || request.IsAuthorizationCodeGrantType())
            {
                var authenticateResult = await httpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
                var sub = authenticateResult.Principal?.FindFirstValue(Claims.Subject);
                if (string.IsNullOrEmpty(sub))
                {
                    return Results.Challenge(
                        properties: new AuthenticationProperties(new Dictionary<string, string?>
                        {
                            [OpenIddictServerAspNetCoreConstants.Properties.Error] = Errors.InvalidGrant,
                            [OpenIddictServerAspNetCoreConstants.Properties.ErrorDescription] = "The token is no longer valid."
                        }),
                        authenticationSchemes: [OpenIddictServerAspNetCoreDefaults.AuthenticationScheme]);
                }

                var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
                identity.AddClaim(Claims.Subject, sub);

                var principal = new ClaimsPrincipal(identity);
                principal.SetScopes(request.GetScopes());

                return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            }

            return Results.BadRequest(new { error = "unsupported_grant_type" });
        })
        .WithTags("OpenIddict")
        .RequireAuthRateLimiting(AuthRateLimitPolicies.Token);

        endpoints.MapGet("/connect/authorize", (HttpContext httpContext) =>
        {
            var request = httpContext.Features.Get<OpenIddictServerAspNetCoreFeature>()?.Transaction?.Request;
            var subject = httpContext.User.FindFirstValue(Claims.Subject)
                ?? httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (httpContext.User.Identity?.IsAuthenticated != true ||
                !Guid.TryParse(subject, out _))
            {
                return Results.Challenge();
            }

            var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme, Claims.Name, Claims.Role);
            identity.AddClaim(Claims.Subject, subject);

            var username = httpContext.User.FindFirstValue(Claims.Name)
                ?? httpContext.User.FindFirstValue(ClaimTypes.Name);
            if (!string.IsNullOrWhiteSpace(username))
            {
                identity.AddClaim(Claims.Name, username);
            }

            var principal = new ClaimsPrincipal(identity);
            if (request is not null)
            {
                principal.SetScopes(request.GetScopes());
            }

            return Results.SignIn(principal, authenticationScheme: OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        })
        .WithTags("OpenIddict")
        .RequireAuthorization();

        endpoints.MapPost("/connect/logout", async (HttpContext httpContext, IIdentityService identityService, CancellationToken ct) =>
        {
            await httpContext.SignOutAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            return Results.Ok(new { message = "OpenIddict session logged out." });
        })
        .WithTags("OpenIddict")
        .RequireAuthRateLimiting(AuthRateLimitPolicies.Token);

        endpoints.MapPost("/connect/revocation", async (HttpContext httpContext, IIdentityService identityService, CancellationToken ct) =>
        {
            var request = httpContext.Features.Get<OpenIddictServerAspNetCoreFeature>()?.Transaction?.Request;
            if (request?.Token is not null)
            {
                await identityService.RevokeTokenAsync(request.Token, ct);
            }
            return Results.Ok();
        })
        .WithTags("OpenIddict")
        .RequireAuthRateLimiting(AuthRateLimitPolicies.Token);

        return endpoints;
    }

    private static void SetRefreshTokenCookie(HttpContext context, string refreshToken)
    {
        context.Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(30),
            Secure = context.Request.IsHttps
        });
    }

    private static void ClearRefreshTokenCookie(HttpContext context)
    {
        context.Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            Path = "/"
        });
    }
}
