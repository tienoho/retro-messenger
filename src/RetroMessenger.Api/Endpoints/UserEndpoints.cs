using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Users;
using RetroMessenger.Contracts.Users;

namespace RetroMessenger.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/me", async (ICurrentUserContext currentUser, UserService userService, CancellationToken ct) =>
        {
            var user = await userService.GetUserProfileAsync(currentUser.UserId, ct);
            return Results.Ok(user);
        });

        group.MapPut("/me/profile", async (UpdateProfileRequest request, ICurrentUserContext currentUser, UserService userService, CancellationToken ct) =>
        {
            var updated = await userService.UpdateProfileAsync(currentUser.UserId, request, ct);
            return Results.Ok(updated);
        });

        group.MapPut("/me/status", async (UpdateStatusRequest request, ICurrentUserContext currentUser, UserService userService, CancellationToken ct) =>
        {
            var updated = await userService.UpdateStatusAsync(currentUser.UserId, request, ct);
            return Results.Ok(updated);
        });

        return endpoints;
    }
}
