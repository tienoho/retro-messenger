using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Calls;
using RetroMessenger.Infrastructure.Calls;

namespace RetroMessenger.Api.Endpoints;

public static class CallEndpoints
{
    public static IEndpointRouteBuilder MapCallEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/calls").WithTags("Calls");

        group.MapPost("/token", async (
            CreateCallTokenRequest request,
            ICurrentUserContext currentUser,
            CallSignalingService callService,
            CancellationToken ct) =>
        {
            if (!currentUser.IsAuthenticated)
            {
                return Results.Unauthorized();
            }

            try
            {
                var response = await callService.IssueCallTokenAsync(currentUser.UserId, request.ConversationId, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Results.Problem(detail: ex.Message, statusCode: 403);
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
        }).RequireAuthorization();

        return endpoints;
    }
}
