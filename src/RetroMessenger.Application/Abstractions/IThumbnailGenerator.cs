namespace RetroMessenger.Application.Abstractions;

public sealed record ThumbnailResult(bool Success, byte[]? ImageBytes, string? ContentType);

public interface IThumbnailGenerator
{
    Task<ThumbnailResult> GenerateThumbnailAsync(Stream content, string contentType, CancellationToken cancellationToken = default);
}
