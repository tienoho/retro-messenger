import { useEffect, useRef } from "react";
import type { MessageDto } from "@retro/contracts";
import type { ImvironmentDefinition } from "@retro/design-tokens";
import { renderWithYahooEmoticons } from "../../utils/emoticons";
import { IconBuzz, IconAudibles, IconPaperclip, IconPencil } from "../../icons/UiIcons";

const attachmentLinePattern = /^\[attachment:([0-9a-f-]{36})\]\s+(.+)$/i;
const audiblePattern = /^\[Audible\]\s+(.+)$/i;

function formatMsgTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export interface ChatTranscriptProps {
  messages: MessageDto[];
  currentUserId: string;
  activeConversationTitle?: string | undefined;
  imvironment?: ImvironmentDefinition | undefined;
  onDownloadAttachment: (attachmentId: string) => void;
  onReplayAudible?: ((text: string) => void) | undefined;
  isTyping: boolean;
}

export function ChatTranscript({
  messages,
  currentUserId,
  activeConversationTitle = "Bạn bè",
  imvironment,
  onDownloadAttachment,
  onReplayAudible,
  isTyping,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const transcriptStyle = imvironment
    ? {
        background: imvironment.background,
        color: imvironment.textColor ?? "#202020",
      }
    : undefined;

  return (
    <>
      <div
        className="transcript"
        style={transcriptStyle}
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="emptyState">
            Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi lời chào đầu
            tiên hoặc rung một tiếng BUZZ!
          </div>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          const senderLabel = isMine ? "Bạn" : activeConversationTitle;

          // BUZZ notification
          if (message.content === "BUZZ!!!" || message.content === "(BUZZ)") {
            return (
              <div className="transcriptMsg buzzMsg" key={message.id}>
                <div className="transcriptMsgHeader">
                  <span className="transcriptTime">
                    [{formatMsgTime(message.createdAt)}]
                  </span>
                  <span
                    className={`transcriptSender ${isMine ? "mine" : "peer"}`}
                  >
                    {senderLabel}:
                  </span>
                </div>
                <div className="buzzBanner">
                  <IconBuzz size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {isMine
                    ? "BẠN VỪA GỬI MỘT BUZZ!"
                    : `BẠN VỪA NHẬN ĐƯỢC MỘT BUZZ TỪ ${activeConversationTitle}!`}
                </div>
              </div>
            );
          }

          // Audible Card
          const audibleMatch = audiblePattern.exec(message.content);
          if (audibleMatch) {
            return (
              <div className="transcriptMsg audibleMsg" key={message.id}>
                <div className="transcriptMsgHeader">
                  <span className="transcriptTime">
                    [{formatMsgTime(message.createdAt)}]
                  </span>
                  <span
                    className={`transcriptSender ${isMine ? "mine" : "peer"}`}
                  >
                    {senderLabel}:
                  </span>
                </div>
                <div className="audibleBanner">
                  <span className="audibleBannerIcon">
                    <IconAudibles size={18} />
                  </span>
                  <span className="audibleBannerText">{audibleMatch[1]}</span>
                  {onReplayAudible && (
                    <button
                      type="button"
                      className="replayAudibleBtn"
                      title="Phát lại âm thanh"
                      onClick={() => onReplayAudible(audibleMatch[1]!)}
                    >
                      ▶ Nghe lại
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="transcriptMsg" key={message.id}>
              <div className="transcriptMsgHeader">
                <span className="transcriptTime">
                  [{formatMsgTime(message.createdAt)}]
                </span>
                <span
                  className={`transcriptSender ${isMine ? "mine" : "peer"}`}
                >
                  {senderLabel}:
                </span>
              </div>
              <div className="transcriptContent">
                {message.content.split("\n").map((line, index) => {
                  const attachment = attachmentLinePattern.exec(line);
                  return attachment ? (
                    <button
                      type="button"
                      className="attachmentDownloadBtn"
                      key={`${attachment[1]}-${index}`}
                      onClick={() => onDownloadAttachment(attachment[1]!)}
                    >
                      <IconPaperclip size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
                      {attachment[2]}
                    </button>
                  ) : (
                    <span key={`${line}-${index}`}>
                      {renderWithYahooEmoticons(line)}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isTyping && (
        <div className="typingBar">
          <span className="pencilIcon">
            <IconPencil size={13} />
          </span>{" "}
          <strong>{activeConversationTitle}</strong> đang soạn tin nhắn...
        </div>
      )}
    </>
  );
}
