import { IconChat, IconContacts, IconRooms } from "../../icons/UiIcons";

export type SidebarTab = "chats" | "contacts" | "rooms";

export interface SidebarTabsProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  pendingRequestsCount?: number;
}

export function SidebarTabs({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0,
}: SidebarTabsProps) {
  return (
    <div className="folderTabs">
      <button
        type="button"
        className={`folderTab ${activeTab === "chats" ? "active" : ""}`}
        onClick={() => onTabChange("chats")}
        title="Trò chuyện đang mở"
      >
        <IconChat size={13} style={{ marginRight: 4, verticalAlign: "middle", flexShrink: 0 }} />
        <span className="tabText">Tin nhắn</span>
      </button>
      <button
        type="button"
        className={`folderTab ${activeTab === "contacts" ? "active" : ""}`}
        onClick={() => onTabChange("contacts")}
        title="Danh bạ bạn bè"
      >
        <IconContacts size={13} style={{ marginRight: 4, verticalAlign: "middle", flexShrink: 0 }} />
        <span className="tabText">Danh bạ {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ""}</span>
      </button>
      <button
        type="button"
        className={`folderTab ${activeTab === "rooms" ? "active" : ""}`}
        onClick={() => onTabChange("rooms")}
        title="Phòng chat công cộng"
      >
        <IconRooms size={13} style={{ marginRight: 4, verticalAlign: "middle", flexShrink: 0 }} />
        <span className="tabText">Phòng</span>
      </button>
    </div>
  );
}

