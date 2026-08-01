namespace RetroMessenger.Application.Abstractions;

public sealed record StoredObjectMetadata(long ContentLength, string ContentType);

public interface IStorageService
{
    Task<string> GeneratePresignedUploadUrlAsync(string objectKey, string contentType, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task<string> GeneratePresignedDownloadUrlAsync(string objectKey, string fileName, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task UploadObjectAsync(string objectKey, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> GetObjectAsync(string objectKey, CancellationToken cancellationToken = default);
    Task<StoredObjectMetadata?> GetObjectMetadataAsync(string objectKey, CancellationToken cancellationToken = default);
    Task DeleteObjectAsync(string objectKey, CancellationToken cancellationToken = default);
}
