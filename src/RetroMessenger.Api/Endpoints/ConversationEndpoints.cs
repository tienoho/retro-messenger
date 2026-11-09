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

        endpoints.MapPost(
            "/api/v1/conversations/direct",
            async (
                CreateDirectConversationRequest request,
                ICurrentUserContext currentUser,
                IConversationRepository repository,
                IUserRepository userRepository,
                IContactRepository contactRepository,
                CancellationToken cancellationToken) =>
            {
                if (request.TargetUserId == currentUser.UserId)
                {
                    return Results.BadRequest(new { error = "Cannot create conversation with yourself." });
                }

                if (await contactRepository.IsBlockedPairAsync(currentUser.UserId, request.TargetUserId, cancellationToken))
                {
                    return Results.BadRequest(new { error = "Cannot create conversation with a blocked contact." });
                }

                var targetProfile = await userRepository.GetByIdAsync(request.TargetUserId, cancellationToken);
                if (targetProfile is null)
                {
                    return Results.NotFound(new { error = "Target user not found." });
                }

                var conversation = await repository.GetOrCreateDirectConversationAsync(
                    currentUser.UserId,
                    request.TargetUserId,
                    targetProfile.DisplayName,
                    cancellationToken);

                return Results.Ok(new ConversationDto(
                    conversation.Id,
                    conversation.Title,
                    conversation.LastSequence,
                    conversation.MemberIds.ToArray()));
            })
            .WithTags("Conversations")
            .RequireAuthorization();

        endpoints.MapPost(
            "/api/v1/conversations",
            async (
                CreateGroupConversationRequest request,
                ICurrentUserContext currentUser,
                IConversationRepository repository,
                CancellationToken cancellationToken) =>
            {
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return Results.BadRequest(new { error = "Conversation title is required." });
                }

                var memberIds = request.MemberIds.Append(currentUser.UserId).Distinct().ToList();
                var conversation = await repository.CreateConversationAsync(
                    request.Title.Trim(),
                    2,
                    memberIds,
                    cancellationToken);

                return Results.Ok(new ConversationDto(
                    conversation.Id,
                    conversation.Title,
                    conversation.LastSequence,
                    conversation.MemberIds.ToArray()));
            })
            .WithTags("Conversations")
            .RequireAuthorization();

        return endpoints;
    }
}
