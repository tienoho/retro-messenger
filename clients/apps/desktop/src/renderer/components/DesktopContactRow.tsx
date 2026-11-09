import type { FriendDto } from "@retro/contracts";

export interface DesktopContactRowProps {
  friend: FriendDto;
  onBlock: (friend: FriendDto) => Promise<void>;
  onStartChat?: (friend: FriendDto) => void;
}

export function DesktopContactRow({
  friend,
  onBlock,
  onStartChat,
}: DesktopContactRowProps) {
  return (
    <div
      className="contactRow"
      onDoubleClick={() => onStartChat?.(friend)}
      title="Nhấp đúp để mở trò chuyện"
    >
      <i className={friend.status === "online" ? "online" : ""} />
      <span>
        {friend.displayName}
        <small>@{friend.username}</small>
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void onBlock(friend);
        }}
      >
        Chặn
      </button>
    </div>
  );
}

