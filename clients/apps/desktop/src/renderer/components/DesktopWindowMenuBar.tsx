import { useState } from "react";
import {
  StatusDotOnline,
  StatusDotAway,
  StatusDotBusy,
  StatusDotInvisible,
  IconDoor,
  IconAdd,
  IconBuzz,
  IconPhone,
  IconVideo,
  IconInfo,
  IconPencil,
  IconPalette,
  IconGame,
} from "../icons/DesktopIcons";

export interface DesktopWindowMenuBarProps {
  onLogout: () => void;
  onOpenAddFriend: () => void;
  onOpenAbout: () => void;
  onOpenCustomStatus: () => void;
  onOpenSkinPicker?: (() => void) | undefined;
  onOpenGame?: (() => void) | undefined;
  onSendBuzz?: (() => void) | undefined;
  onStartVoiceCall?: (() => void) | undefined;
  onStartVideoCall?: (() => void) | undefined;
  onChangeStatus?:
    | ((status: "online" | "away" | "busy" | "invisible") => void)
    | undefined;
  onClearCache?: (() => void) | undefined;
}

export function DesktopWindowMenuBar({
  onLogout,
  onOpenAddFriend,
  onOpenAbout,
  onOpenCustomStatus,
  onOpenSkinPicker,
  onOpenGame,
  onSendBuzz,
  onStartVoiceCall,
  onStartVideoCall,
  onChangeStatus,
  onClearCache,
}: DesktopWindowMenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggle = (menu: string) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const close = () => setActiveMenu(null);

  return (
    <nav className="retroMenuBar" aria-label="Menu tác vụ">
      {/* 1. Messenger menu */}
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
                onOpenCustomStatus();
                close();
              }}
            >
              <IconPencil size={12} style={{ marginRight: 6 }} />
              Đổi lời nhắn trạng thái…
            </div>
            {onOpenSkinPicker && (
              <div
                className="dropdownItem"
                onClick={() => {
                  onOpenSkinPicker();
                  close();
                }}
              >
                <IconPalette size={12} style={{ marginRight: 6 }} />
                Đổi giao diện (Skins)…
              </div>
            )}
            {onClearCache && (
              <div
                className="dropdownItem"
                onClick={() => {
                  onClearCache();
                  close();
                }}
              >
                Xóa bộ nhớ đệm cục bộ
              </div>
            )}
            <div className="dropdownDivider" />
            <div
              className="dropdownItem"
              onClick={() => {
                onLogout();
                close();
              }}
            >
              <IconDoor size={12} style={{ marginRight: 6 }} />
              Đăng xuất
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                if (window.retroDesktop?.closeWindow) {
                  void window.retroDesktop.closeWindow();
                } else {
                  onLogout();
                }
                close();
              }}
            >
              Thoát ứng dụng
            </div>
          </div>
        )}
      </div>

      {/* 2. Contacts menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "contacts" ? "active" : ""}`}
          onClick={() => toggle("contacts")}
        >
          Danh bạ
        </div>
        {activeMenu === "contacts" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div
              className="dropdownItem"
              onClick={() => {
                onOpenAddFriend();
                close();
              }}
            >
              <IconAdd size={12} style={{ marginRight: 6 }} />
              Thêm bạn bè mới…
            </div>
          </div>
        )}
      </div>

      {/* 3. Actions menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "actions" ? "active" : ""}`}
          onClick={() => toggle("actions")}
        >
          Hành động
        </div>
        {activeMenu === "actions" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div
              className="dropdownItem"
              onClick={() => {
                onSendBuzz?.();
                close();
              }}
            >
              <IconBuzz size={12} style={{ marginRight: 6 }} />
              Gửi BUZZ! rung chuông
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                onStartVoiceCall?.();
                close();
              }}
            >
              <IconPhone size={12} style={{ marginRight: 6 }} />
              Bắt đầu gọi thoại Audio
            </div>
            <div
              className="dropdownItem"
              onClick={() => {
                onStartVideoCall?.();
                close();
              }}
            >
              <IconVideo size={12} style={{ marginRight: 6 }} />
              Bắt đầu gọi video Webcam
            </div>
            {onOpenGame && (
              <div
                className="dropdownItem"
                onClick={() => {
                  onOpenGame();
                  close();
                }}
              >
                <IconGame size={12} style={{ marginRight: 6 }} />
                Chơi cờ Caro (Yahoo! Games)…
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Help menu */}
      <div className="retroMenuContainer">
        <div
          className={`retroMenuItem ${activeMenu === "help" ? "active" : ""}`}
          onClick={() => toggle("help")}
        >
          Trợ giúp
        </div>
        {activeMenu === "help" && (
          <div className="menuDropdown" onMouseLeave={close}>
            <div
              className="dropdownItem"
              onClick={() => {
                onOpenAbout();
                close();
              }}
            >
              <IconInfo size={12} style={{ marginRight: 6 }} />
              Giới thiệu Retro Yahoo! Messenger
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

