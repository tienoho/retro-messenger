using RetroMessenger.Application.Abstractions;
using RetroMessenger.Application.Media;
using RetroMessenger.Contracts.Media;

namespace RetroMessenger.Api.Endpoints;

public static class MediaEndpoints
{
    public static IEndpointRouteBuilder MapMediaEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/media")
            .WithTags("Media")
            .RequireAuthorization();

        group.MapPost("/upload-url", async (
            CreatePresignedUrlRequest request,
            ICurrentUserContext currentUser,
            MediaStorageService service,
            CancellationToken ct) =>
            Results.Ok(await service.CreateUploadAsync(currentUser.UserId, request, ct)));

        group.MapPost("/{attachmentId:guid}/complete", async (
            Guid attachmentId,
            ICurrentUserContext currentUser,
            MediaStorageService service,
            CancellationToken ct) =>
            Results.Ok(await service.CompleteUploadAsync(
                currentUser.UserId,
                attachmentId,
                ct)));

        group.MapGet("/{attachmentId:guid}/status", async (
            Guid attachmentId,
            ICurrentUserContext currentUser,
            MediaStorageService service,
            CancellationToken ct) =>
            Results.Ok(await service.GetStatusAsync(
                currentUser.UserId,
                attachmentId,
                ct)));

        group.MapGet("/{attachmentId:guid}", async (
            Guid attachmentId,
            ICurrentUserContext currentUser,
            MediaStorageService service,
            CancellationToken ct) =>
            Results.Ok(await service.GetDownloadUrlAsync(
                currentUser.UserId,
                attachmentId,
                ct)));

        return endpoints;
    }
}
