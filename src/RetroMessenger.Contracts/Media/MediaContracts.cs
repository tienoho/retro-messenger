namespace RetroMessenger.Contracts.Media;

public sealed record UploadUrlRequest(string FileName, string ContentType, long FileSizeBytes);

public sealed record UploadUrlResponse(string UploadUrl, string FileKey, string DownloadUrl);

public sealed record CreatePresignedUrlRequest(Guid ConversationId, string FileName, string ContentType, long FileSizeBytes);

public sealed record PresignedUrlResponse(Guid AttachmentId, string UploadUrl, string ObjectKey, DateTimeOffset ExpiresAt);

public sealed record PresignedDownloadUrlResponse(Guid AttachmentId, string DownloadUrl, DateTimeOffset ExpiresAt);

public sealed record AttachmentStatusResponse(Guid AttachmentId, string Status);
