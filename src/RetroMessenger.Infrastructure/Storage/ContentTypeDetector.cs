using System.Text;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Storage;

public sealed class ContentTypeDetector : IContentTypeDetector
{
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    private static readonly byte[] ZipLocalFileSignature = [0x50, 0x4B, 0x03, 0x04];
    private static readonly byte[] ZipEmptyArchiveSignature = [0x50, 0x4B, 0x05, 0x06];
    private static readonly byte[] ZipSpannedSignature = [0x50, 0x4B, 0x07, 0x08];
    private static readonly UTF8Encoding StrictUtf8 = new(
        encoderShouldEmitUTF8Identifier: false,
        throwOnInvalidBytes: true);

    public async Task<string?> DetectAsync(
        Stream content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);

        var prefix = new byte[16];
        var prefixLength = 0;
        while (prefixLength < prefix.Length)
        {
            var bytesRead = await content.ReadAsync(
                prefix.AsMemory(prefixLength, prefix.Length - prefixLength),
                cancellationToken);
            if (bytesRead == 0)
            {
                break;
            }

            prefixLength += bytesRead;
        }

        var detected = DetectBinarySignature(prefix.AsSpan(0, prefixLength));
        if (detected is not null)
        {
            return detected;
        }

        return await IsUtf8TextAsync(
            content,
            prefix.AsMemory(0, prefixLength),
            cancellationToken)
            ? "text/plain"
            : null;
    }

    private static string? DetectBinarySignature(ReadOnlySpan<byte> prefix)
    {
        if (prefix.StartsWith(JpegSignature))
        {
            return "image/jpeg";
        }

        if (prefix.StartsWith(PngSignature))
        {
            return "image/png";
        }

        if (prefix.StartsWith("GIF87a"u8) || prefix.StartsWith("GIF89a"u8))
        {
            return "image/gif";
        }

        if (prefix.Length >= 12 &&
            prefix[..4].SequenceEqual("RIFF"u8) &&
            prefix.Slice(8, 4).SequenceEqual("WEBP"u8))
        {
            return "image/webp";
        }

        if (prefix.Length >= 12 && prefix.Slice(4, 4).SequenceEqual("ftyp"u8))
        {
            return "video/mp4";
        }

        if (prefix.StartsWith("ID3"u8) ||
            (prefix.Length >= 2 && prefix[0] == 0xFF && (prefix[1] & 0xE0) == 0xE0))
        {
            return "audio/mpeg";
        }

        if (prefix.StartsWith("OggS"u8))
        {
            return "audio/ogg";
        }

        if (prefix.StartsWith("%PDF-"u8))
        {
            return "application/pdf";
        }

        if (prefix.StartsWith(ZipLocalFileSignature) ||
            prefix.StartsWith(ZipEmptyArchiveSignature) ||
            prefix.StartsWith(ZipSpannedSignature))
        {
            return "application/zip";
        }

        return null;
    }

    private static async Task<bool> IsUtf8TextAsync(
        Stream remainder,
        ReadOnlyMemory<byte> prefix,
        CancellationToken cancellationToken)
    {
        var decoder = StrictUtf8.GetDecoder();
        var chars = new char[4096];

        try
        {
            if (!DecodeAndValidate(decoder, prefix.Span, chars, flush: false))
            {
                return false;
            }

            var buffer = new byte[4096];
            while (true)
            {
                var bytesRead = await remainder.ReadAsync(buffer, cancellationToken);
                if (bytesRead == 0)
                {
                    break;
                }

                if (!DecodeAndValidate(decoder, buffer.AsSpan(0, bytesRead), chars, flush: false))
                {
                    return false;
                }
            }

            return DecodeAndValidate(decoder, ReadOnlySpan<byte>.Empty, chars, flush: true);
        }
        catch (DecoderFallbackException)
        {
            return false;
        }
    }

    private static bool DecodeAndValidate(
        Decoder decoder,
        ReadOnlySpan<byte> bytes,
        Span<char> chars,
        bool flush)
    {
        while (!bytes.IsEmpty || flush)
        {
            decoder.Convert(
                bytes,
                chars,
                flush,
                out var bytesUsed,
                out var charsUsed,
                out var completed);

            for (var index = 0; index < charsUsed; index++)
            {
                var character = chars[index];
                if (character == '\0' ||
                    (char.IsControl(character) && character is not ('\r' or '\n' or '\t' or '\f')))
                {
                    return false;
                }
            }

            bytes = bytes[bytesUsed..];
            if (completed)
            {
                return true;
            }

            if (bytesUsed == 0 && charsUsed == 0)
            {
                return false;
            }

            flush = flush && bytes.IsEmpty;
        }

        return true;
    }
}
