using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Messaging;
using RetroMessenger.Contracts.Messaging;

namespace RetroMessenger.Api.Endpoints;

public static class MessagingEndpoints
{
    public static IEndpointRouteBuilder MapMessagingEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet(
            "/api/v1/conversations/{conversationId:guid}/messages",
            async (
                Guid conversationId,
                long? afterSequence,
                int? limit,
                ICurrentUserContext currentUser,
                IConversationRepository conversations,
                IMessageRepository repository,
                CancellationToken cancellationToken) =>
            {
                var conversation = await conversations.GetAsync(
                    conversationId,
                    cancellationToken);

                if (conversation is null)
                {
                    return Results.NotFound();
                }

                if (!conversation.HasMember(currentUser.UserId))
                {
                    return Results.Forbid();
                }

                var items = await repository.ListAsync(
                    conversationId,
                    afterSequence,
                    limit ?? 50,
                    cancellationToken);

                return Results.Ok(
                    items.Select(MessageMapper.ToDto));
            })
            .WithTags("Messaging")
            .RequireAuthorization();

        endpoints.MapPost(
            "/api/v1/conversations/{conversationId:guid}/messages",
            async (
                Guid conversationId,
                SendMessageRequest request,
                ICurrentUserContext currentUser,
                SendMessageService service,
                CancellationToken cancellationToken) =>
            {
                var result = await service.ExecuteAsync(
                    currentUser.UserId,
                    conversationId,
                    request,
                    cancellationToken);

                return Results.Ok(result);
            })
            .WithTags("Messaging")
            .RequireAuthorization();

        return endpoints;
    }
}
