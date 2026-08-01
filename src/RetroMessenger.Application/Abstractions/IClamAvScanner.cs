namespace RetroMessenger.Application.Abstractions;

public sealed record VirusScanResult(bool IsClean, string? VirusName = null);

public interface IClamAvScanner
{
    Task<VirusScanResult> ScanAsync(Stream content, string fileName, CancellationToken cancellationToken = default);
}
