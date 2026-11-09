import type { FriendDto } from "@retro/contracts";
import {
  StatusDotOnline,
  StatusDotAway,
  StatusDotBusy,
  StatusDotInvisible,
  IconChat,
  IconBuzz,
  IconPhone,
  IconBlock,
} from "../icons/DesktopIcons";

export interface DesktopContactRowProps {
  friend: FriendDto;
  onBlock: (friend: FriendDto) => Promise<void>;
  onStartChat?: ((friend: FriendDto) => void) | undefined;
  onSendBuzz?: ((userId: string) => void) | undefined;
  onStartCall?: ((userId: string, displayName: string) => void) | undefined;
}

export function DesktopContactRow({
  friend,
  onBlock,
  onStartChat,
  onSendBuzz,
  onStartCall,
}: DesktopContactRowProps) {
  const renderStatus = () => {
    switch (friend.status) {
      case "online":
        return <StatusDotOnline size={10} />;
      case "away":
        return <StatusDotAway size={10} />;
      case "busy":
        return <StatusDotBusy size={10} />;
      case "invisible":
      default:
        return <StatusDotInvisible size={10} />;
    }
  };

  return (
    <div
      className="contactRow"
      onClick={() => onStartChat?.(friend)}
      onDoubleClick={() => onStartChat?.(friend)}
      title="Nhấp để bắt đầu trò chuyện"
    >
      <span className="contactStatusDot">
        {renderStatus()}
      </span>
      <div className="contactDetails">
        <span className="contactName">{friend.displayName}</span>
        <small className="contactUsername">@{friend.username}</small>
      </div>

      <div className="contactQuickActions">
        <button
          type="button"
          className="contactActionBtn"
          title="Nhắn tin trò chuyện"
          onClick={(e) => {
            e.stopPropagation();
            onStartChat?.(friend);
          }}
        >
          <IconChat size={11} />
        </button>
        {onSendBuzz && (
          <button
            type="button"
            className="contactActionBtn"
            title="Gửi BUZZ! rung chuông"
            onClick={(e) => {
              e.stopPropagation();
              onSendBuzz(friend.userId);
            }}
          >
            <IconBuzz size={11} />
          </button>
        )}
        {onStartCall && (
          <button
            type="button"
            className="contactActionBtn"
            title="Bắt đầu gọi thoại Audio"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall(friend.userId, friend.displayName);
            }}
          >
            <IconPhone size={11} />
          </button>
        )}
        <button
          type="button"
          className="contactActionBtn danger"
          title="Chặn liên hệ này"
          onClick={(e) => {
            e.stopPropagation();
            void onBlock(friend);
          }}
        >
          <IconBlock size={11} />
        </button>
      </div>
    </div>
  );
}
