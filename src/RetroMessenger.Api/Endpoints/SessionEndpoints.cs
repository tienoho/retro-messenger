using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Authentication;

namespace RetroMessenger.Api.Endpoints;

public static class SessionEndpoints
{
    public static IEndpointRouteBuilder MapSessionEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
            "/api/v1/session",
            async (ICurrentUserContext currentUser, IUserRepository userRepo, CancellationToken ct) =>
            {
                if (!currentUser.IsAuthenticated || currentUser.UserId == Guid.Empty)
                {
                    return Results.Json(
                        new { error = "unauthorized", message = "User is not authenticated." },
                        statusCode: StatusCodes.Status401Unauthorized);
                }

                var user = await userRepo.GetByIdAsync(currentUser.UserId, ct);
                if (user is null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(new SessionDto(user));
            })
            .WithTags("Session")
            .RequireAuthorization();

        return endpoints;
    }
}
