import { useState, type FormEvent } from "react";
import type { UserDto } from "@retro/contracts";
import { SmileyHappy, SmileySad, SmileyWorried, SmileyCool } from "../../icons/YahooSmileys";
import { IconAdd, IconRooms, IconBuzz, IconMusic, IconPencil } from "../../icons/UiIcons";

export interface UserProfileStripProps {
  user: UserDto;
  userStatus: string;
  customStatus: string;
  onStatusChange: (nextStatus: string) => Promise<void>;
  onCustomStatusChange: (nextCustomStatus: string) => Promise<void>;
  onOpenAddFriend: () => void;
  onOpenRooms: () => void;
  onSendBuzz?: (() => void) | undefined;
  hasActiveConversation: boolean;
}

export function UserProfileStrip({
  user,
  userStatus,
  customStatus,
  onStatusChange,
  onCustomStatusChange,
  onOpenAddFriend,
  onOpenRooms,
  onSendBuzz,
  hasActiveConversation,
}: UserProfileStripProps) {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusInput, setStatusInput] = useState(customStatus);

  const handleSaveCustomStatus = async (e: FormEvent) => {
    e.preventDefault();
    await onCustomStatusChange(statusInput.trim());
    setIsEditingStatus(false);
  };

  const renderStatusAvatar = () => {
    switch (userStatus) {
      case "online":
        return <SmileyHappy size={30} />;
      case "away":
        return <SmileyWorried size={30} />;
      case "busy":
        return <SmileySad size={30} />;
      case "offline":
      case "invisible":
      default:
        return <SmileyCool size={30} style={{ opacity: 0.6, filter: "grayscale(60%)" }} />;
    }
  };

  return (
    <>
      <div className="profileStrip">
        <div className="profileAvatar">{renderStatusAvatar()}</div>
        <div className="profileDetails">
          <div className="profileNameRow">
            <span className="profileName" title={user.displayName}>
              {user.displayName}
            </span>
            <select
              className="statusSelect"
              value={userStatus}
              onChange={e => void onStatusChange(e.target.value)}
              aria-label="Chọn trạng thái"
            >
              <option value="online">Trực tuyến (Online)</option>
              <option value="busy">Bận (Busy)</option>
              <option value="away">Vắng mặt (Away)</option>
              <option value="offline">Ẩn mình (Invisible)</option>
            </select>
          </div>

          <div className="customStatusRow">
            {isEditingStatus ? (
              <form onSubmit={handleSaveCustomStatus} style={{ display: "flex", gap: "2px" }}>
                <input
                  className="customStatusInput"
                  placeholder="Trạng thái / bài hát..."
                  value={statusInput}
                  onChange={e => setStatusInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="editStatusBtn" title="Lưu">✓</button>
                <button
                  type="button"
                  className="editStatusBtn"
                  title="Hủy"
                  onClick={() => setIsEditingStatus(false)}
                >
                  ✕
                </button>
              </form>
            ) : (
              <>
                <span
                  className="customStatusText"
                  title={customStatus || "Chưa có trạng thái"}
                  onClick={() => {
                    setStatusInput(customStatus);
                    setIsEditingStatus(true);
                  }}
                >
                  {customStatus ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <IconMusic size={11} />
                      <span>{customStatus}</span>
                    </span>
                  ) : (
                    "<Nhấp để viết trạng thái...>"
                  )}
                </span>
                <button
                  type="button"
                  className="editStatusBtn"
                  title="Sửa trạng thái"
                  onClick={() => {
                    setStatusInput(customStatus);
                    setIsEditingStatus(true);
                  }}
                >
                  <IconPencil size={11} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="toolstrip">
        <button
          type="button"
          className="toolstripBtn"
          onClick={onOpenAddFriend}
          title="Thêm bạn bè mới vào danh bạ"
        >
          <IconAdd size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
          Thêm bạn
        </button>
        <button
          type="button"
          className="toolstripBtn"
          onClick={onOpenRooms}
          title="Duyệt phòng trò chuyện công cộng"
        >
          <IconRooms size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
          Phòng chat
        </button>
        {hasActiveConversation && onSendBuzz && (
          <button
            type="button"
            className="toolstripBtn"
            onClick={onSendBuzz}
            title="Gửi tín hiệu BUZZ!"
          >
            <IconBuzz size={12} style={{ marginRight: 3, verticalAlign: "middle" }} />
            BUZZ!
          </button>
        )}
      </div>
    </>
  );
}
