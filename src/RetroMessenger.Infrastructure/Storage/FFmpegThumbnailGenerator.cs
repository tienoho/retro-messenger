using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Storage;

public sealed class FFmpegOptions
{
    public const string SectionName = "FFmpeg";

    public string ExecutablePath { get; set; } = "ffmpeg";
    public int MaxDimensionPixels { get; set; } = 320;
    public int TimeoutSeconds { get; set; } = 30;
}

#pragma warning disable CA1848
public sealed class FFmpegThumbnailGenerator(
    IOptions<FFmpegOptions> options,
    ILogger<FFmpegThumbnailGenerator> logger) : IThumbnailGenerator
{
    private readonly FFmpegOptions _options = options.Value;

    public async Task<ThumbnailResult> GenerateThumbnailAsync(
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);

        if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) &&
            !contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
        {
            return new ThumbnailResult(false, null, null);
        }

        if (string.IsNullOrWhiteSpace(_options.ExecutablePath) || _options.MaxDimensionPixels <= 0)
        {
            throw new InvalidOperationException("FFmpeg executable path and maximum dimension must be configured.");
        }

        var inputPath = Path.Combine(Path.GetTempPath(), $"retro-media-{Guid.NewGuid():N}.input");
        var outputPath = Path.Combine(Path.GetTempPath(), $"retro-thumb-{Guid.NewGuid():N}.png");

        try
        {
            await using (var inputFile = new FileStream(
                inputPath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                FileOptions.Asynchronous | FileOptions.SequentialScan))
            {
                await content.CopyToAsync(inputFile, cancellationToken);
            }

            using var process = new Process
            {
                StartInfo = CreateStartInfo(inputPath, outputPath),
                EnableRaisingEvents = true
            };

            if (!process.Start())
            {
                throw new InvalidOperationException("FFmpeg process could not be started.");
            }

            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            using var timeoutSource = new CancellationTokenSource(TimeSpan.FromSeconds(Math.Max(1, _options.TimeoutSeconds)));
            using var linkedSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutSource.Token);

            try
            {
                await process.WaitForExitAsync(linkedSource.Token);
            }
            catch (OperationCanceledException)
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                    await process.WaitForExitAsync(CancellationToken.None);
                }

                throw;
            }

            var error = await errorTask;
            if (process.ExitCode != 0 || !File.Exists(outputPath))
            {
                logger.LogWarning(
                    "FFmpeg thumbnail generation failed with exit code {ExitCode}: {Error}",
                    process.ExitCode,
                    Truncate(error, 1000));
                return new ThumbnailResult(false, null, null);
            }

            var thumbnailBytes = await File.ReadAllBytesAsync(outputPath, cancellationToken);
            if (thumbnailBytes.Length == 0)
            {
                return new ThumbnailResult(false, null, null);
            }

            return new ThumbnailResult(true, thumbnailBytes, "image/png");
        }
        finally
        {
            DeleteTemporaryFile(inputPath);
            DeleteTemporaryFile(outputPath);
        }
    }

    private ProcessStartInfo CreateStartInfo(string inputPath, string outputPath)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _options.ExecutablePath,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardOutput = false
        };

        startInfo.ArgumentList.Add("-hide_banner");
        startInfo.ArgumentList.Add("-loglevel");
        startInfo.ArgumentList.Add("error");
        startInfo.ArgumentList.Add("-y");
        startInfo.ArgumentList.Add("-i");
        startInfo.ArgumentList.Add(inputPath);
        startInfo.ArgumentList.Add("-vf");
        startInfo.ArgumentList.Add($"thumbnail,scale={_options.MaxDimensionPixels}:{_options.MaxDimensionPixels}:force_original_aspect_ratio=decrease");
        startInfo.ArgumentList.Add("-frames:v");
        startInfo.ArgumentList.Add("1");
        startInfo.ArgumentList.Add(outputPath);
        return startInfo;
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static void DeleteTemporaryFile(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
