import type {
  ConversationDto,
  DesktopTransferProgress,
  MessageDto,
} from "@retro/contracts";
import type { ImvironmentDefinition } from "@retro/design-tokens";
import type { DesktopOutboxEntry } from "../../shared/ipc-contracts.ts";
import { DesktopMessageItem } from "./DesktopMessageItem";

export interface DesktopTranscriptProps {
  active: ConversationDto | null;
  messages: MessageDto[];
  pending: DesktopOutboxEntry[];
  currentUserId?: string | undefined;
  transfer: DesktopTransferProgress | null;
  error: string | null;
  imvironment?: ImvironmentDefinition | undefined;
  onDownloadAttachment: (attachmentId: string, fileName: string) => Promise<void>;
}

export function DesktopTranscript({
  active,
  messages,
  pending,
  currentUserId,
  transfer,
  error,
  imvironment,
  onDownloadAttachment,
}: DesktopTranscriptProps) {
  return (
    <>
      <div
        className="history"
        aria-live="polite"
        style={
          imvironment
            ? {
                background: imvironment.background,
                color: imvironment.textColor ?? "#202020",
              }
            : undefined
        }
      >
        {!active && (
          <p className="emptyState">Chưa có cuộc trò chuyện nào.</p>
        )}
        {messages.map((message) => (
          <DesktopMessageItem
            key={message.id}
            message={message}
            mine={message.senderId === currentUserId}
            onDownloadAttachment={onDownloadAttachment}
          />
        ))}
        {pending.map((entry) => (
          <article
            className="message mine pending"
            key={entry.clientMessageId}
          >
            <p>{entry.content.split("\n")[0]}</p>
            <small>
              {entry.state === "failed-permanent"
                ? "Không thể gửi"
                : "Đang chờ gửi…"}
            </small>
          </article>
        ))}
      </div>

      {transfer && (
        <div className={`transfer ${transfer.state}`}>
          {transfer.direction === "upload" ? "Tải lên" : "Tải xuống"}:{" "}
          {transfer.fileName} — {transfer.state}
        </div>
      )}

      {error && (
        <p className="chatError" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

