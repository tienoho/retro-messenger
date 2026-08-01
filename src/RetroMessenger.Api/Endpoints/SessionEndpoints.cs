using RetroMessenger.Application.Abstractions;

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
                    return Results.Unauthorized();
                }

                var user = await userRepo.GetByIdAsync(currentUser.UserId, ct);
                if (user is null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(new { user });
            })
            .WithTags("Session")
            .RequireAuthorization();

        return endpoints;
    }
}
