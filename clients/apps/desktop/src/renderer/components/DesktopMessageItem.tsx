import type { MessageDto } from "@retro/contracts";
import {
  attachmentPattern,
  renderWithYahooEmoticons,
} from "../utils/desktop-messages";
import { IconBuzz, IconPaperclip, IconAudibles } from "../icons/DesktopIcons";

export interface DesktopMessageItemProps {
  message: MessageDto;
  mine: boolean;
  onDownloadAttachment: (attachmentId: string, fileName: string) => Promise<void>;
}

export function DesktopMessageItem({
  message,
  mine,
  onDownloadAttachment,
}: DesktopMessageItemProps) {
  const attachment = attachmentPattern.exec(message.content);
  const isBuzz = message.content === "BUZZ!!!" || message.content === "(BUZZ)";
  const isAudible = message.content.startsWith("[Audible]");

  if (isBuzz) {
    return (
      <article className="message buzzMessage">
        <div className="buzzBanner">
          <IconBuzz size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
          <strong>{mine ? "BẠN VỪA GỬI BUZZ!" : "BẠN NHẬN ĐƯỢC MỘT BUZZ!"}</strong>
        </div>
        <small>#{message.sequence}</small>
      </article>
    );
  }

  const attachmentName = attachment
    ? (attachment[2] ?? attachment[1] ?? "")
    : "";
  const attachmentId = attachment
    ? (attachment[3] ?? attachment[1] ?? "")
    : "";

  return (
    <article className={mine ? "message mine" : "message peer"}>
      <span className="senderLabel">{mine ? "Bạn: " : "Bạn bè: "}</span>
      {isAudible ? (
        <span className="audibleBadge">
          <IconAudibles size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {message.content}
        </span>
      ) : attachment ? (
        <button
          type="button"
          className="attachmentButton"
          onClick={() =>
            void onDownloadAttachment(attachmentId, attachmentName)
          }
        >
          <IconPaperclip size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {attachmentName}
        </button>
      ) : (
        <span className="messageBodyText">{renderWithYahooEmoticons(message.content)}</span>
      )}
      <small className="messageSeq">#{message.sequence}</small>
    </article>
  );
}
