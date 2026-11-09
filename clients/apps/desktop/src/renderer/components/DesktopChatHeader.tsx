import type { ConversationDto } from "@retro/contracts";
import { IconBuzz, IconPaperclip, IconPencil } from "../icons/DesktopIcons";

export interface DesktopChatHeaderProps {
  active: ConversationDto | null;
  typingUsersCount: number;
  pendingCount: number;
  lastBuzzAt: number;
  onAttach: () => void;
  onSendBuzz: () => void;
}

export function DesktopChatHeader({
  active,
  typingUsersCount,
  pendingCount,
  lastBuzzAt,
  onAttach,
  onSendBuzz,
}: DesktopChatHeaderProps) {
  const elapsed = Math.floor((Date.now() - lastBuzzAt) / 1000);
  const remaining = Math.max(0, 10 - elapsed);
  const isBuzzCooldown = remaining > 0;

  return (
    <header className="chatHeader">
      <div>
        <strong>{active?.title ?? "Chưa có cuộc trò chuyện"}</strong>
        <span>
          {typingUsersCount > 0 ? (
            <span>
              <IconPencil size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
              Đang nhập tin nhắn…
            </span>
          ) : pendingCount > 0 ? (
            `${pendingCount} tin đang chờ gửi`
          ) : (
            "Đã đồng bộ"
          )}
        </span>
      </div>
      <div className="headerActions">
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
