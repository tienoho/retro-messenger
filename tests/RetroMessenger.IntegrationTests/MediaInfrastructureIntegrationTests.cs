using System.Buffers.Binary;
using System.Net;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using RetroMessenger.Infrastructure.Storage;
using Xunit;

namespace RetroMessenger.IntegrationTests;

public sealed class MediaInfrastructureIntegrationTests
{
    public static TheoryData<byte[], string> ContentTypeSamples => new()
    {
        { [0xFF, 0xD8, 0xFF, 0x00], "image/jpeg" },
        { [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], "image/png" },
        { "GIF89a"u8.ToArray(), "image/gif" },
        { "RIFF0000WEBP"u8.ToArray(), "image/webp" },
        { [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D], "video/mp4" },
        { "ID3sample"u8.ToArray(), "audio/mpeg" },
        { "OggSsample"u8.ToArray(), "audio/ogg" },
        { "%PDF-1.7"u8.ToArray(), "application/pdf" },
        { [0x50, 0x4B, 0x03, 0x04], "application/zip" },
        { "Xin chào Retro Messenger\n"u8.ToArray(), "text/plain" }
    };

    [Theory]
    [MemberData(nameof(ContentTypeSamples))]
    public async Task ContentTypeDetectorRecognizesAllowedSignatures(
        byte[] content,
        string expectedContentType)
    {
        var detector = new ContentTypeDetector();

        var detected = await detector.DetectAsync(new MemoryStream(content));

        Assert.Equal(expectedContentType, detected);
    }

    [Theory]
    [InlineData(new byte[] { 0x00, 0x01, 0x02 })]
    [InlineData(new byte[] { 0xC3, 0x28 })]
    public async Task ContentTypeDetectorRejectsBinaryOrInvalidUtf8(byte[] content)
    {
        var detector = new ContentTypeDetector();

        var detected = await detector.DetectAsync(new MemoryStream(content));

        Assert.Null(detected);
    }

    [Theory]
    [InlineData("stream: OK", true, null)]
    [InlineData("stream: Eicar-Signature FOUND", false, "Eicar-Signature")]
    public async Task ClamAvScannerUsesInStreamProtocolAndParsesResult(
        string daemonResponse,
        bool expectedClean,
        string? expectedVirus)
    {
        var payload = Encoding.UTF8.GetBytes("scanner protocol payload");
        await using var daemon = await FakeClamAvDaemon.StartAsync(daemonResponse);
        var scanner = CreateScanner(daemon.Port);

        var result = await scanner.ScanAsync(new MemoryStream(payload), "sample.bin");

        Assert.Equal(expectedClean, result.IsClean);
        Assert.Equal(expectedVirus, result.VirusName);
        Assert.Equal(payload, await daemon.ReceivedPayload.Task);
    }

    [Fact]
    public async Task ClamAvScannerRejectsDaemonErrors()
    {
        await using var daemon = await FakeClamAvDaemon.StartAsync("stream: size limit exceeded ERROR");
        var scanner = CreateScanner(daemon.Port);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => scanner.ScanAsync(new MemoryStream([1, 2, 3]), "sample.bin"));

        Assert.Contains("size limit exceeded", exception.Message, StringComparison.Ordinal);
        Assert.Equal([1, 2, 3], await daemon.ReceivedPayload.Task);
    }

    [Fact]
    public async Task FFmpegThumbnailGeneratorSkipsUnsupportedContentTypes()
    {
        var generator = new FFmpegThumbnailGenerator(
            Options.Create(new FFmpegOptions { ExecutablePath = "missing-ffmpeg" }),
            NullLogger<FFmpegThumbnailGenerator>.Instance);

        var result = await generator.GenerateThumbnailAsync(
            new MemoryStream("plain text"u8.ToArray()),
            "text/plain");

        Assert.False(result.Success);
        Assert.Null(result.ImageBytes);
        Assert.Null(result.ContentType);
    }

    private static ClamAvScanner CreateScanner(int port) =>
        new(Options.Create(new ClamAvOptions
        {
            Host = IPAddress.Loopback.ToString(),
            Port = port,
            ChunkSizeBytes = 7,
            TimeoutSeconds = 5
        }));

    private sealed class FakeClamAvDaemon : IAsyncDisposable
    {
        private readonly TcpListener _listener;
        private readonly Task _serverTask;

        private FakeClamAvDaemon(TcpListener listener, string response)
        {
            _listener = listener;
            ReceivedPayload = new TaskCompletionSource<byte[]>(TaskCreationOptions.RunContinuationsAsynchronously);
            _serverTask = ServeAsync(response);
        }

        public int Port => ((IPEndPoint)_listener.LocalEndpoint).Port;
        public TaskCompletionSource<byte[]> ReceivedPayload { get; }

        public static Task<FakeClamAvDaemon> StartAsync(string response)
        {
            var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            return Task.FromResult(new FakeClamAvDaemon(listener, response));
        }

        public async ValueTask DisposeAsync()
        {
            _listener.Stop();
            await _serverTask;
        }

        private async Task ServeAsync(string response)
        {
            try
            {
                using var client = await _listener.AcceptTcpClientAsync();
                await using var stream = client.GetStream();

                var command = new byte[10];
                await stream.ReadExactlyAsync(command);
                if (!command.AsSpan().SequenceEqual("zINSTREAM\0"u8))
                {
                    throw new InvalidOperationException("Unexpected ClamAV command framing.");
                }

                using var payload = new MemoryStream();
                var lengthPrefix = new byte[sizeof(uint)];
                while (true)
                {
                    await stream.ReadExactlyAsync(lengthPrefix);
                    var length = BinaryPrimitives.ReadUInt32BigEndian(lengthPrefix);
                    if (length == 0)
                    {
                        break;
                    }

                    var chunk = new byte[checked((int)length)];
                    await stream.ReadExactlyAsync(chunk);
                    await payload.WriteAsync(chunk);
                }

                ReceivedPayload.TrySetResult(payload.ToArray());
                await stream.WriteAsync(Encoding.UTF8.GetBytes(response + "\0"));
            }
            catch (Exception exception)
            {
                ReceivedPayload.TrySetException(exception);
                throw;
            }
        }
    }
}
