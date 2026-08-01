using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Messaging;

namespace RetroMessenger.Api.Endpoints;

public static class ConversationEndpoints
{
    public static IEndpointRouteBuilder MapConversationEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
            "/api/v1/conversations",
            async (
                ICurrentUserContext currentUser,
                IConversationRepository repository,
                CancellationToken cancellationToken) =>
            {
                var items = await repository.ListAsync(
                    currentUser.UserId,
                    cancellationToken);

                return Results.Ok(items.Select(x =>
                    new ConversationDto(
                        x.Id,
                        x.Title,
                        x.LastSequence,
                        x.MemberIds.ToArray())));
            })
            .WithTags("Conversations")
            .RequireAuthorization();

        return endpoints;
    }
}
