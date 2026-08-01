using System.Net;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Microsoft.Extensions.Options;
using RetroMessenger.Application.Abstractions;

namespace RetroMessenger.Infrastructure.Storage;

public sealed class S3StorageService : IStorageService, IDisposable
{
    private readonly StorageOptions _options;
    private readonly AmazonS3Client _internalClient;
    private readonly AmazonS3Client _publicSigningClient;
    private readonly SemaphoreSlim _bucketInitialization = new(1, 1);
    private bool _bucketReady;

    public S3StorageService(IOptions<StorageOptions> options)
    {
        _options = options.Value;
        ValidateOptions(_options);

        var credentials = new BasicAWSCredentials(_options.AccessKey, _options.SecretKey);
        _internalClient = new AmazonS3Client(
            credentials,
            CreateClientConfig(_options.Endpoint));
        _publicSigningClient = new AmazonS3Client(
            credentials,
            CreateClientConfig(_options.PublicEndpoint));
    }

    public async Task<string> GeneratePresignedUploadUrlAsync(
        string objectKey,
        string contentType,
        TimeSpan expiry,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        return await _publicSigningClient.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = NormalizeObjectKey(objectKey),
            ContentType = contentType,
            Verb = HttpVerb.PUT,
            Protocol = GetProtocol(_options.PublicEndpoint),
            Expires = DateTime.UtcNow.Add(expiry)
        });
    }

    public async Task<string> GeneratePresignedDownloadUrlAsync(
        string objectKey,
        string fileName,
        TimeSpan expiry,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        var safeFileName = Path.GetFileName(fileName).Replace("\"", string.Empty, StringComparison.Ordinal);
        return await _publicSigningClient.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = NormalizeObjectKey(objectKey),
            Verb = HttpVerb.GET,
            Protocol = GetProtocol(_options.PublicEndpoint),
            Expires = DateTime.UtcNow.Add(expiry),
            ResponseHeaderOverrides = new ResponseHeaderOverrides
            {
                ContentDisposition = $"attachment; filename=\"{safeFileName}\""
            }
        });
    }

    public async Task UploadObjectAsync(
        string objectKey,
        Stream content,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        await _internalClient.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = NormalizeObjectKey(objectKey),
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false
        }, cancellationToken);
    }

    public async Task<Stream?> GetObjectAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        try
        {
            var response = await _internalClient.GetObjectAsync(
                _options.BucketName,
                NormalizeObjectKey(objectKey),
                cancellationToken);
            return new ResponseOwnedStream(response);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<StoredObjectMetadata?> GetObjectMetadataAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        try
        {
            var response = await _internalClient.GetObjectMetadataAsync(
                _options.BucketName,
                NormalizeObjectKey(objectKey),
                cancellationToken);
            return new StoredObjectMetadata(response.ContentLength, response.Headers.ContentType ?? string.Empty);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task DeleteObjectAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken);
        await _internalClient.DeleteObjectAsync(
            _options.BucketName,
            NormalizeObjectKey(objectKey),
            cancellationToken);
    }

    public void Dispose()
    {
        _internalClient.Dispose();
        _publicSigningClient.Dispose();
        _bucketInitialization.Dispose();
    }

    private async Task EnsureBucketAsync(CancellationToken cancellationToken)
    {
        if (_bucketReady)
        {
            return;
        }

        await _bucketInitialization.WaitAsync(cancellationToken);
        try
        {
            if (_bucketReady)
            {
                return;
            }

            var exists = await AmazonS3Util.DoesS3BucketExistV2Async(
                _internalClient,
                _options.BucketName);
            if (!exists)
            {
                if (!_options.AutoCreateBucket)
                {
                    throw new InvalidOperationException(
                        $"Storage bucket '{_options.BucketName}' does not exist.");
                }

                await _internalClient.PutBucketAsync(new PutBucketRequest
                {
                    BucketName = _options.BucketName,
                    UseClientRegion = true
                }, cancellationToken);
            }

            _bucketReady = true;
        }
        finally
        {
            _bucketInitialization.Release();
        }
    }

    private AmazonS3Config CreateClientConfig(string endpoint) =>
        new()
        {
            ServiceURL = endpoint.TrimEnd('/'),
            UseHttp = Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri) &&
                endpointUri.Scheme == Uri.UriSchemeHttp,
            ForcePathStyle = _options.UsePathStyle,
            AuthenticationRegion = _options.Region
        };

    private static Protocol GetProtocol(string endpoint) =>
        Uri.TryCreate(endpoint, UriKind.Absolute, out var endpointUri) &&
        endpointUri.Scheme == Uri.UriSchemeHttp
            ? Protocol.HTTP
            : Protocol.HTTPS;

    private static string NormalizeObjectKey(string objectKey)
    {
        var normalized = objectKey.Replace('\\', '/').Trim('/');
        if (string.IsNullOrWhiteSpace(normalized) ||
            normalized.Split('/').Any(segment => segment is "." or ".."))
        {
            throw new ArgumentException("Object key is invalid.", nameof(objectKey));
        }

        return normalized;
    }

    private static void ValidateOptions(StorageOptions options)
    {
        if (!Uri.TryCreate(options.Endpoint, UriKind.Absolute, out _) ||
            !Uri.TryCreate(options.PublicEndpoint, UriKind.Absolute, out _))
        {
            throw new InvalidOperationException("Storage endpoints must be absolute URLs.");
        }

        if (string.IsNullOrWhiteSpace(options.AccessKey) ||
            string.IsNullOrWhiteSpace(options.SecretKey) ||
            string.IsNullOrWhiteSpace(options.BucketName))
        {
            throw new InvalidOperationException("Storage credentials and bucket name are required.");
        }
    }

    private sealed class ResponseOwnedStream(GetObjectResponse response) : Stream
    {
        private readonly Stream _inner = response.ResponseStream;

        public override bool CanRead => _inner.CanRead;
        public override bool CanSeek => _inner.CanSeek;
        public override bool CanWrite => false;
        public override long Length => _inner.Length;
        public override long Position { get => _inner.Position; set => _inner.Position = value; }
        public override void Flush() => _inner.Flush();
        public override int Read(byte[] buffer, int offset, int count) => _inner.Read(buffer, offset, count);
        public override long Seek(long offset, SeekOrigin origin) => _inner.Seek(offset, origin);
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        public override Task FlushAsync(CancellationToken cancellationToken) => _inner.FlushAsync(cancellationToken);
        public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) =>
            _inner.ReadAsync(buffer, offset, count, cancellationToken);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            _inner.ReadAsync(buffer, cancellationToken);

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                response.Dispose();
            }
            base.Dispose(disposing);
        }

        public override async ValueTask DisposeAsync()
        {
            await base.DisposeAsync();
            GC.SuppressFinalize(this);
        }
    }
}
