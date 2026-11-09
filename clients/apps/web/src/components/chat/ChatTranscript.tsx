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
  lastReadSequence?: number | undefined;
}

export function ChatTranscript({
  messages,
  currentUserId,
  activeConversationTitle,
  imvironment,
  onDownloadAttachment,
  onReplayAudible,
  isTyping,
  lastReadSequence = 0,
}: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const peerInitial = (
    activeConversationTitle?.trim().slice(0, 1) || "B"
  ).toUpperCase();

  const lastMineMessage = messages
    .filter((m) => m.senderId === currentUserId)
    .slice(-1)[0];

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
        {!activeConversationTitle ? (
          <div className="emptyState welcomeStandbyState">
            <div className="standbyLogo">Y!</div>
            <h3>Chào mừng bạn đến với Yahoo! Messenger</h3>
            <p>
              Hãy chọn một cuộc trò chuyện từ danh bạ bên trái để bắt đầu nhắn
              tin hoặc tham gia phòng chat.
            </p>
          </div>
        ) : (
          <>
            <div className="retroTranscriptNotice">
              *** Phiên trò chuyện với <strong>{activeConversationTitle}</strong> ***
            </div>

            {messages.length === 0 && (
              <div className="emptyState">
                Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi lời chào đầu
                tiên hoặc rung một tiếng BUZZ!
              </div>
            )}
          </>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          const senderLabel = isMine ? "Bạn" : (activeConversationTitle || "Bạn bè");

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
                {isMine && (
                  <>
                    {lastReadSequence !== undefined &&
                    lastReadSequence > 0 &&
                    message.sequence > 0 &&
                    message.sequence <= lastReadSequence ? (
                      message.id === lastMineMessage?.id ||
                      message.sequence === lastReadSequence ? (
                        <span
                          className="msgStatusSeen"
                          title="Người nhận đã đọc tin nhắn này"
                        >
                          <span className="miniSeenAvatar">{peerInitial}</span>
                          <span className="seenLabel">Đã xem</span>
                        </span>
                      ) : (
                        <span
                          className="msgStatusSent"
                          title="Đã gửi thành công và đã xem"
                        >
                          <span className="sentCheckCircle">✓</span>
                        </span>
                      )
                    ) : message.sequence > 0 ? (
                      <span
                        className="msgStatusSent"
                        title="Đã gửi thành công tới máy chủ"
                      >
                        <span className="sentCheckCircle">✓</span>
                        <span className="sentLabel">Đã gửi</span>
                      </span>
                    ) : (
                      <span
                        className="msgStatusPending"
                        title="Đang gửi tin nhắn..."
                      >
                        <span className="pendingCircle" />
                        <span className="pendingLabel">Đang gửi…</span>
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="transcriptContent">
                {attachmentLinePattern.test(message.content.trim()) ? (
                  message.content.split("\n").map((line, index) => {
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
                  })
                ) : (
                  renderWithYahooEmoticons(message.content)
                )}
              </div>
            </div>
          );
        })}

        {/* Facebook Messenger-style Animated Typing Bubble */}
        {isTyping && (
          <div className="fbTypingContainer" aria-live="polite">
            <div className="fbTypingAvatar">{peerInitial}</div>
            <div className="fbTypingBubble">
              <div className="fbTypingDots">
                <span className="fbDot dot1" />
                <span className="fbDot dot2" />
                <span className="fbDot dot3" />
              </div>
            </div>
            <span className="fbTypingText">
              <IconPencil size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
              {activeConversationTitle} đang nhập tin nhắn...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}
