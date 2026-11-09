import { useState, useRef, useEffect } from "react";
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
  IconPencil,
  IconPalette,
  IconGame,
} from "../../icons/UiIcons";

export interface WindowMenuBarProps {
  onLogout: () => void;
  onOpenAddFriend: () => void;
  onOpenRooms: () => void;
  onOpenAbout: () => void;
  onOpenCustomStatus?: (() => void) | undefined;
  onOpenChangePassword?: (() => void) | undefined;
  onOpenSkinPicker?: (() => void) | undefined;
  onOpenGame?: (() => void) | undefined;
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
  onOpenCustomStatus,
  onOpenChangePassword,
  onOpenSkinPicker,
  onOpenGame,
  onSendBuzz,
  onStartCall,
  onChangeStatus,
}: WindowMenuBarProps) {
  const menuBarRef = useRef<HTMLElement | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggle = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const close = () => setActiveMenu(null);

  useEffect(() => {
    if (!activeMenu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu]);

  return (
    <nav className="retroMenuBar" ref={menuBarRef} aria-label="Menu thanh tác vụ">
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
            {onOpenCustomStatus && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onOpenCustomStatus();
                }}
              >
                <IconPencil size={12} style={{ marginRight: 6 }} />
                Đổi lời nhắn cá nhân…
              </div>
            )}
            {onOpenChangePassword && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onOpenChangePassword();
                }}
              >
                <IconPencil size={12} style={{ marginRight: 6 }} />
                Đổi mật khẩu tài khoản…
              </div>
            )}
            {onOpenSkinPicker && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onOpenSkinPicker();
                }}
              >
                <IconPalette size={13} style={{ marginRight: 6 }} />
                Đổi giao diện (Skins)…
              </div>
            )}
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
            {onOpenGame && (
              <div
                className="dropdownItem"
                onClick={() => {
                  close();
                  onOpenGame();
                }}
              >
                <IconGame size={13} style={{ marginRight: 6 }} />
                Chơi cờ Caro (Yahoo! Games)…
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
              About Yahoo! Messenger...
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
