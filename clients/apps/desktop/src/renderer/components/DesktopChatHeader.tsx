import type { ConversationDto } from "@retro/contracts";
import {
  IconBuzz,
  IconPaperclip,
  IconPencil,
  IconPhone,
  IconVideo,
} from "../icons/DesktopIcons";

export interface DesktopChatHeaderProps {
  active: ConversationDto | null;
  typingUsersCount: number;
  pendingCount: number;
  lastBuzzAt: number;
  onAttach: () => void;
  onSendBuzz: () => void;
  onStartVoiceCall?: (() => void) | undefined;
  onStartVideoCall?: (() => void) | undefined;
}

export function DesktopChatHeader({
  active,
  typingUsersCount,
  pendingCount,
  lastBuzzAt,
  onAttach,
  onSendBuzz,
  onStartVoiceCall,
  onStartVideoCall,
}: DesktopChatHeaderProps) {
  const elapsed = Math.floor((Date.now() - lastBuzzAt) / 1000);
  const remaining = Math.max(0, 10 - elapsed);
  const isBuzzCooldown = remaining > 0;

  return (
    <header className="chatHeader">
      <div className="chatHeaderLeft">
        <div className="chatHeaderAvatar">
          {active?.title?.slice(0, 1).toUpperCase() ?? "Y"}
        </div>
        <div className="chatHeaderMeta">
          <strong title={active?.title ?? "Chưa có cuộc trò chuyện"}>
            {active?.title ?? "Chưa có cuộc trò chuyện"}
          </strong>
          <span>
            {typingUsersCount > 0 ? (
              <span>
                <IconPencil size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Đang nhập tin nhắn…
              </span>
            ) : pendingCount > 0 ? (
              `${pendingCount} tin đang chờ gửi`
            ) : (
              "Trực tuyến — Sẵn sàng trò chuyện"
            )}
          </span>
        </div>
      </div>
      <div className="headerActions">
        <button
          type="button"
          onClick={onStartVoiceCall}
          disabled={!active || !onStartVoiceCall}
          title="Gọi thoại Voice Chat"
        >
          <IconPhone size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Thoại
        </button>
        <button
          type="button"
          onClick={onStartVideoCall}
          disabled={!active || !onStartVideoCall}
          title="Gọi video Webcam"
        >
          <IconVideo size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Video
        </button>
        <button
          type="button"
          onClick={onAttach}
          disabled={!active}
          title="Đính kèm tệp"
        >
          <IconPaperclip size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Tệp
        </button>
        <button
          type="button"
          onClick={onSendBuzz}
          disabled={!active || isBuzzCooldown}
          title={
            isBuzzCooldown
              ? `Chờ ${remaining}s để Buzz tiếp`
              : "Rung chuông Buzz gây chú ý"
          }
        >
          <IconBuzz size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {isBuzzCooldown ? `Buzz (${remaining}s)` : "Buzz"}
        </button>
      </div>
    </header>
  );
}
