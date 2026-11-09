import { useState } from "react";
import {
  StatusDotOnline,
  StatusDotBusy,
  StatusDotAway,
  StatusDotInvisible,
  IconDoor,
  IconAdd,
  IconBuzz,
  IconPhone,
  IconRooms,
  IconInfo,
} from "../../icons/UiIcons";

export interface WindowMenuBarProps {
  onLogout: () => void;
  onOpenAddFriend: () => void;
  onOpenRooms: () => void;
  onOpenAbout: () => void;
  onSendBuzz?: (() => void) | undefined;
  onStartCall?: (() => void) | undefined;
  onChangeStatus?:
    | ((status: "online" | "away" | "busy" | "invisible") => void)
    | undefined;
}

export function WindowMenuBar({
  onLogout,
  onOpenAddFriend,
  onOpenRooms,
  onOpenAbout,
  onSendBuzz,
  onStartCall,
  onChangeStatus,
}: WindowMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggle = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const close = () => setActiveMenu(null);

  return (
    <nav className="retroMenuBar" aria-label="Menu thanh tác vụ">
      {/* Messenger menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "messenger" ? "active" : ""}`}
          onClick={() => toggle("messenger")}
        >
          Messenger
        </div>
        {activeMenu === "messenger" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div className="dropdownHeader">Trạng thái của tôi</div>
            <div
              className="dropdownItem"
              onClick={() => {
                onChangeStatus?.("online");
                close();
              }}
            >
              <StatusDotOnline size={12} style={{ marginRight: 6 }} />
              Trực tuyến (Available)
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                onChangeStatus?.("busy");
                close();
              }}
            >
              <StatusDotBusy size={12} style={{ marginRight: 6 }} />
              Bận (Busy)
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                onChangeStatus?.("away");
                close();
              }}
            >
              <StatusDotAway size={12} style={{ marginRight: 6 }} />
              Vắng mặt (Away)
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                onChangeStatus?.("invisible");
                close();
              }}
            >
              <StatusDotInvisible size={12} style={{ marginRight: 6 }} />
              Ẩn (Invisible)
            </div>
            <div className="dropdownDivider" />
            <div
              className="dropdownItem"
              onClick={() => {
                close();
                onLogout();
              }}
            >
              <IconDoor size={13} style={{ marginRight: 6 }} />
              Đăng xuất (Sign Out)
            </div>
          </div>
        )}
      </div>

      {/* Contacts menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "contacts" ? "active" : ""}`}
          onClick={() => toggle("contacts")}
        >
          Contacts
        </div>
        {activeMenu === "contacts" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div
              className="dropdownItem"
              onClick={() => {
                close();
                onOpenAddFriend();
              }}
            >
              <IconAdd size={13} style={{ marginRight: 6 }} />
              Thêm bạn bè mới...
            </div>
          </div>
        )}
      </div>

      {/* Actions menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "actions" ? "active" : ""}`}
          onClick={() => toggle("actions")}
        >
          Actions
        </div>
        {activeMenu === "actions" && (
          <div className="menuDropdown" onMouseLeave={close}>
            {onSendBuzz && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onSendBuzz();
                }}
              >
                <IconBuzz size={13} style={{ marginRight: 6 }} />
                Rung chuông (Send BUZZ!)
              </div>
            )}
            {onStartCall && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onStartCall();
                }}
              >
                <IconPhone size={13} style={{ marginRight: 6 }} />
                Bắt đầu cuộc gọi (LiveKit Call)
              </div>
            )}
            <div
              className="dropdownItem"
              onClick={() => {
                close();
                onOpenRooms();
              }}
            >
              <IconRooms size={13} style={{ marginRight: 6 }} />
              Khám phá phòng trò chuyện (Rooms)
            </div>
          </div>
        )}
      </div>

      {/* Help menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "help" ? "active" : ""}`}
          onClick={() => toggle("help")}
        >
          Help
        </div>
        {activeMenu === "help" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div
              className="dropdownItem"
              onClick={() => {
                close();
                onOpenAbout();
              }}
            >
              <IconInfo size={13} style={{ marginRight: 6 }} />
              About Retro! Messenger...
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
