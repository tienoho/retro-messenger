using RetroMessenger.Api.Security;
using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Contacts;
using RetroMessenger.Contracts.Contacts;

namespace RetroMessenger.Api.Endpoints;

public static class ContactEndpoints
{
    public static IEndpointRouteBuilder MapContactEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/contacts")
            .WithTags("Contacts")
            .RequireAuthorization();

        group.MapGet("/", async (
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.GetFriendsAsync(currentUser.UserId, ct)));

        group.MapPost("/requests", async (
            SendFriendRequest request,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.SendFriendRequestAsync(currentUser.UserId, request, ct)))
            .RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        group.MapGet("/requests", async (
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.GetPendingRequestsAsync(currentUser.UserId, ct)));

        group.MapGet("/requests/state", async (
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.GetRequestStateAsync(currentUser.UserId, ct)));

        group.MapPost("/requests/{id:guid}/accept", async (
            Guid id,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
        {
            await contactService.AcceptFriendRequestAsync(id, currentUser.UserId, ct);
            return Results.Ok(new { message = "Friend request accepted." });
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        group.MapPost("/requests/{id:guid}/reject", async (
            Guid id,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
        {
            await contactService.RejectFriendRequestAsync(id, currentUser.UserId, ct);
            return Results.Ok(new { message = "Friend request rejected." });
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        group.MapPost("/requests/{id:guid}/cancel", async (
            Guid id,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
        {
            await contactService.CancelFriendRequestAsync(id, currentUser.UserId, ct);
            return Results.Ok(new { message = "Friend request cancelled." });
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        group.MapGet("/blocks", async (
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.GetBlockedContactsAsync(currentUser.UserId, ct)));

        group.MapPost("/blocks", async (
            BlockContactRequest request,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
            Results.Ok(await contactService.BlockAsync(currentUser.UserId, request.UserId, ct)))
            .RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        group.MapDelete("/blocks/{userId:guid}", async (
            Guid userId,
            ICurrentUserContext currentUser,
            ContactService contactService,
            CancellationToken ct) =>
        {
            await contactService.UnblockAsync(currentUser.UserId, userId, ct);
            return Results.Ok(new { message = "Contact unblocked." });
        }).RequireAuthRateLimiting(AuthRateLimitPolicies.ContactMutation);

        return endpoints;
    }
}
