import { useCallback, useState } from "react";
import type { RetroApiClient } from "@retro/api-client";
import type { AttachmentMetadata } from "@retro/contracts";

const statusPollDelayMs = 500;
const statusPollLimit = 60;

export async function putFileToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": contentType },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Object storage upload failed with HTTP ${response.status}.`);
  }
}

export function useAttachmentUpload(api: RetroApiClient) {
  const [attachments, setAttachments] = useState<AttachmentMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (conversationId: string, file: File): Promise<AttachmentMetadata | null> => {
      const localId = crypto.randomUUID();
      const localObjectUrl = URL.createObjectURL(file);
      const contentType = file.type || "application/octet-stream";
      const newAttachment: AttachmentMetadata = {
        id: localId,
        fileName: file.name,
        contentType,
        fileSizeBytes: file.size,
        url: localObjectUrl,
        status: "uploading",
        progress: 10,
      };

      setUploadError(null);
      setAttachments(previous => [...previous, newAttachment]);
      setIsUploading(true);

      try {
        const presigned = await api.getUploadUrl(
          conversationId,
          file.name,
          contentType,
          file.size,
        );
        setAttachments(previous => previous.map(item =>
          item.id === localId ? { ...item, progress: 45 } : item));

        await putFileToPresignedUrl(presigned.uploadUrl, file, contentType);
        await api.completeAttachmentUpload(presigned.attachmentId);
        setAttachments(previous => previous.map(item =>
          item.id === localId
            ? { ...item, id: presigned.attachmentId, status: "processing", progress: 80 }
            : item));

        for (let attempt = 0; attempt < statusPollLimit; attempt += 1) {
          const status = await api.getAttachmentStatus(presigned.attachmentId);
          if (status.status === "ready") {
            const completed: AttachmentMetadata = {
              ...newAttachment,
              id: presigned.attachmentId,
              status: "completed",
              progress: 100,
            };
            setAttachments(previous => previous.map(item =>
              item.id === presigned.attachmentId ? completed : item));
            return completed;
          }

          if (status.status === "quarantined" || status.status === "failed") {
            throw new Error(`Attachment processing ended with status ${status.status}.`);
          }

          await new Promise(resolve => setTimeout(resolve, statusPollDelayMs));
        }

        throw new Error("Attachment processing timed out.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Attachment upload failed.";
        setUploadError(message);
        setAttachments(previous => previous.map(item =>
          item.id === localId || item.url === localObjectUrl
            ? { ...item, status: "failed", progress: 0 }
            : item));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [api],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments(previous => {
      const removed = previous.find(item => item.id === id);
      if (removed?.url.startsWith("blob:")) URL.revokeObjectURL(removed.url);
      return previous.filter(item => item.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments(previous => {
      for (const item of previous) {
        if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
      }
      return [];
    });
    setUploadError(null);
  }, []);

  return {
    attachments,
    isUploading,
    uploadError,
    uploadFile,
    removeAttachment,
    clearAttachments,
  };
}
