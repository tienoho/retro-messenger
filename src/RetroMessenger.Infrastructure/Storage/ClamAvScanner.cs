using System.Buffers.Binary;
using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Storage;

public sealed class ClamAvOptions
{
    public const string SectionName = "ClamAv";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 3310;
    public int ChunkSizeBytes { get; set; } = 64 * 1024;
    public int TimeoutSeconds { get; set; } = 60;
}

public sealed class ClamAvScanner(IOptions<ClamAvOptions> options) : IClamAvScanner
{
    private static readonly byte[] InStreamCommand = "zINSTREAM\0"u8.ToArray();
    private readonly ClamAvOptions _options = options.Value;

    public async Task<VirusScanResult> ScanAsync(
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);
        _ = fileName;

        if (string.IsNullOrWhiteSpace(_options.Host) || _options.Port is <= 0 or > 65535)
        {
            throw new InvalidOperationException("ClamAV host and port must be configured.");
        }

        if (_options.ChunkSizeBytes is <= 0 or > 1024 * 1024)
        {
            throw new InvalidOperationException("ClamAV chunk size must be between 1 byte and 1 MiB.");
        }

        using var timeoutSource = new CancellationTokenSource(TimeSpan.FromSeconds(Math.Max(1, _options.TimeoutSeconds)));
        using var linkedSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutSource.Token);
        var token = linkedSource.Token;

        using var client = new TcpClient();
        await client.ConnectAsync(_options.Host, _options.Port, token);
        await using var network = client.GetStream();

        await network.WriteAsync(InStreamCommand, token);

        var buffer = new byte[_options.ChunkSizeBytes];
        var lengthPrefix = new byte[sizeof(uint)];
        while (true)
        {
            var bytesRead = await content.ReadAsync(buffer, token);
            if (bytesRead == 0)
            {
                break;
            }

            BinaryPrimitives.WriteUInt32BigEndian(lengthPrefix, (uint)bytesRead);
            await network.WriteAsync(lengthPrefix, token);
            await network.WriteAsync(buffer.AsMemory(0, bytesRead), token);
        }

        Array.Clear(lengthPrefix);
        await network.WriteAsync(lengthPrefix, token);
        await network.FlushAsync(token);

        var response = await ReadNullTerminatedResponseAsync(network, token);
        if (response.EndsWith(" OK", StringComparison.Ordinal))
        {
            return new VirusScanResult(true);
        }

        const string foundSuffix = " FOUND";
        if (response.EndsWith(foundSuffix, StringComparison.Ordinal))
        {
            var separatorIndex = response.IndexOf(':');
            var virusStart = separatorIndex >= 0 ? separatorIndex + 1 : 0;
            var virusLength = response.Length - virusStart - foundSuffix.Length;
            var virusName = response.Substring(virusStart, virusLength).Trim();
            return new VirusScanResult(false, virusName.Length == 0 ? "Virus detected" : virusName);
        }

        throw new InvalidOperationException($"ClamAV scan failed: {response}");
    }

    private static async Task<string> ReadNullTerminatedResponseAsync(
        NetworkStream network,
        CancellationToken cancellationToken)
    {
        const int maxResponseBytes = 8 * 1024;
        using var response = new MemoryStream();
        var buffer = new byte[512];

        while (response.Length < maxResponseBytes)
        {
            var bytesRead = await network.ReadAsync(buffer, cancellationToken);
            if (bytesRead == 0)
            {
                break;
            }

            var terminatorIndex = Array.IndexOf(buffer, (byte)0, 0, bytesRead);
            var bytesToWrite = terminatorIndex >= 0 ? terminatorIndex : bytesRead;
            response.Write(buffer, 0, bytesToWrite);
            if (terminatorIndex >= 0)
            {
                break;
            }
        }

        if (response.Length == 0 || response.Length >= maxResponseBytes)
        {
            throw new InvalidOperationException("ClamAV returned an empty or oversized response.");
        }

        return Encoding.UTF8.GetString(response.GetBuffer(), 0, checked((int)response.Length));
    }
}
