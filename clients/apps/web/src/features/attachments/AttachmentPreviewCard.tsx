import React from "react";
import type { AttachmentMetadata } from "@retro/contracts";
import { IconFile } from "../../icons/UiIcons";

export interface AttachmentPreviewCardProps {
  attachment: AttachmentMetadata;
  onRemove?: (id: string) => void;
}

export function AttachmentPreviewCard({
  attachment,
  onRemove,
}: AttachmentPreviewCardProps) {
  const isImage = attachment.contentType.startsWith("image/");
  const formattedSize =
    attachment.fileSizeBytes > 1024 * 1024
      ? `${(attachment.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(attachment.fileSizeBytes / 1024)} KB`;

  return (
    <div className="attachmentCard" data-testid="attachment-preview">
      <div className="attachmentThumbnail">
        {isImage && attachment.url ? (
          <img src={attachment.url} alt={attachment.fileName} />
        ) : (
          <span className="fileIcon">
            <IconFile size={20} />
          </span>
        )}
      </div>

      <div className="attachmentInfo">
        <span className="fileName" title={attachment.fileName}>
          {attachment.fileName}
        </span>
        <span className="fileSize">{formattedSize}</span>

        {attachment.status === "uploading" && (
          <div className="uploadProgress">
            <div
              className="progressBar"
              style={{ width: `${attachment.progress ?? 0}%` }}
            />
            <small>Đang tải lên {attachment.progress ?? 0}%</small>
          </div>
        )}

        {attachment.status === "processing" && (
          <span className="statusTag">Đang kiểm tra an toàn…</span>
        )}

        {attachment.status === "completed" && (
          <span className="statusTag success">✓ Đã sẵn sàng</span>
        )}

        {attachment.status === "failed" && (
          <span className="statusTag danger">✕ Thất bại</span>
        )}
      </div>

      {onRemove && attachment.id && (
        <button
          type="button"
          className="removeBtn"
          onClick={() => onRemove(attachment.id!)}
          title="Xóa tệp đính kèm"
        >
          ✕
        </button>
      )}
    </div>
  );
}
