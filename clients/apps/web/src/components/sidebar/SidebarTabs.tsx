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
      >
        <IconChat size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
        Tin nhắn
      </button>
      <button
        type="button"
        className={`folderTab ${activeTab === "contacts" ? "active" : ""}`}
        onClick={() => onTabChange("contacts")}
      >
        <IconContacts size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
        Danh bạ {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
      </button>
      <button
        type="button"
        className={`folderTab ${activeTab === "rooms" ? "active" : ""}`}
        onClick={() => onTabChange("rooms")}
      >
        <IconRooms size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
        Phòng
      </button>
    </div>
  );
}

