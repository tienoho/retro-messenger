using RetroMessenger.Application.Abstractions;
using RetroMessenger.Contracts.Media;
using RetroMessenger.Domain.Common;
using RetroMessenger.Domain.Media;

namespace RetroMessenger.Application.Media;

public sealed class MediaStorageService(
    IAttachmentRepository attachmentRepository,
    IStorageService storageService,
    IConversationRepository conversationRepository)
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "audio/mpeg",
        "audio/ogg",
        "application/pdf",
        "application/zip",
        "text/plain"
    };

    public async Task<PresignedUrlResponse> CreateUploadAsync(
        Guid userId,
        CreatePresignedUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureConversationMemberAsync(userId, request.ConversationId, cancellationToken);
        ValidateRequest(request);

        var attachmentId = Guid.CreateVersion7();
        var extension = NormalizeExtension(Path.GetExtension(request.FileName));
        var objectKey = $"attachments/{request.ConversationId:N}/{attachmentId:N}{extension}";
        var uploadUrl = await storageService.GeneratePresignedUploadUrlAsync(
            objectKey,
            request.ContentType,
            TimeSpan.FromMinutes(15),
            cancellationToken);

        var attachment = new Attachment(
            attachmentId,
            request.ConversationId,
            userId,
            request.FileName,
            request.ContentType,
            request.FileSizeBytes,
            objectKey,
            "uploading");
        await attachmentRepository.AddAsync(attachment, cancellationToken);

        return new PresignedUrlResponse(
            attachmentId,
            uploadUrl,
            objectKey,
            DateTimeOffset.UtcNow.AddMinutes(15));
    }

    public async Task<AttachmentStatusResponse> CompleteUploadAsync(
        Guid userId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await GetAuthorizedAttachmentAsync(
            userId,
            attachmentId,
            requireUploader: true,
            cancellationToken);

        if (attachment.Status is "pending" or "processing" or "ready")
        {
            return new AttachmentStatusResponse(attachment.Id, attachment.Status);
        }

        if (attachment.Status != "uploading")
        {
            throw new DomainException("Attachment upload cannot be completed in its current state.");
        }

        var metadata = await storageService.GetObjectMetadataAsync(
            attachment.ObjectKey,
            cancellationToken)
            ?? throw new DomainException("Uploaded object was not found.");

        if (metadata.ContentLength != attachment.FileSizeBytes ||
            !string.Equals(
                metadata.ContentType,
                attachment.ContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            await storageService.DeleteObjectAsync(attachment.ObjectKey, cancellationToken);
            await attachmentRepository.UpdateStatusAsync(
                attachment.Id,
                "failed",
                "Uploaded object metadata did not match the request.",
                cancellationToken: cancellationToken);
            throw new DomainException("Uploaded object size or content type did not match the request.");
        }

        await attachmentRepository.UpdateStatusAsync(
            attachment.Id,
            "pending",
            cancellationToken: cancellationToken);
        return new AttachmentStatusResponse(attachment.Id, "pending");
    }

    public async Task<AttachmentStatusResponse> GetStatusAsync(
        Guid userId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await GetAuthorizedAttachmentAsync(
            userId,
            attachmentId,
            requireUploader: false,
            cancellationToken);
        return new AttachmentStatusResponse(attachment.Id, attachment.Status);
    }

    public async Task<PresignedDownloadUrlResponse> GetDownloadUrlAsync(
        Guid userId,
        Guid attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await GetAuthorizedAttachmentAsync(
            userId,
            attachmentId,
            requireUploader: false,
            cancellationToken);

        if (attachment.Status == "quarantined")
        {
            throw new UnauthorizedAccessException("Attachment has been quarantined.");
        }

        if (attachment.Status != "ready")
        {
            throw new DomainException("Attachment is not ready for download.");
        }

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(15);
        var downloadUrl = await storageService.GeneratePresignedDownloadUrlAsync(
            attachment.ObjectKey,
            attachment.FileName,
            TimeSpan.FromMinutes(15),
            cancellationToken);
        return new PresignedDownloadUrlResponse(attachment.Id, downloadUrl, expiresAt);
    }

    private async Task<Attachment> GetAuthorizedAttachmentAsync(
        Guid userId,
        Guid attachmentId,
        bool requireUploader,
        CancellationToken cancellationToken)
    {
        var attachment = await attachmentRepository.GetByIdAsync(attachmentId, cancellationToken)
            ?? throw new KeyNotFoundException("Attachment was not found.");
        await EnsureConversationMemberAsync(userId, attachment.ConversationId, cancellationToken);

        if (requireUploader && attachment.UploaderId != userId)
        {
            throw new UnauthorizedAccessException("Only the uploader can complete this upload.");
        }

        return attachment;
    }

    private async Task EnsureConversationMemberAsync(
        Guid userId,
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var conversation = await conversationRepository.GetAsync(conversationId, cancellationToken);
        if (conversation is null)
        {
            throw new KeyNotFoundException("Conversation was not found.");
        }

        if (!conversation.HasMember(userId))
        {
            throw new UnauthorizedAccessException("User is not a member of this conversation.");
        }
    }

    private static void ValidateRequest(CreatePresignedUrlRequest request)
    {
        if (request.ConversationId == Guid.Empty)
        {
            throw new DomainException("Conversation ID is required.");
        }

        if (string.IsNullOrWhiteSpace(request.FileName) ||
            request.FileName.Length > 255 ||
            !string.Equals(request.FileName, Path.GetFileName(request.FileName), StringComparison.Ordinal))
        {
            throw new DomainException("File name is invalid.");
        }

        if (!AllowedContentTypes.Contains(request.ContentType))
        {
            throw new DomainException("File content type is not allowed.");
        }

        if (request.FileSizeBytes is <= 0 or > 26_214_400)
        {
            throw new DomainException("File size must be between 1 byte and 25 MB.");
        }
    }

    private static string NormalizeExtension(string extension)
    {
        if (string.IsNullOrEmpty(extension) ||
            extension.Length > 10 ||
            extension.Skip(1).Any(character => !char.IsLetterOrDigit(character)))
        {
            return string.Empty;
        }

        return extension.ToLowerInvariant();
    }
}
