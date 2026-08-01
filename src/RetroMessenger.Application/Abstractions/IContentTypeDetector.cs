namespace RetroMessenger.Application.Abstractions;

public interface IContentTypeDetector
{
    Task<string?> DetectAsync(
        Stream content,
        CancellationToken cancellationToken = default);
}
