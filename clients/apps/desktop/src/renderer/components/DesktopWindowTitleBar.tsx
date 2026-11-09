import {
  IconSpeaker,
  IconSpeakerMuted,
  YahooLogoIcon,
} from "../icons/DesktopIcons";

export interface DesktopWindowTitleBarProps {
  title?: string;
  displayName: string;
  status: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export function DesktopWindowTitleBar({
  title = "Retro! Yahoo! Messenger",
  displayName,
  status,
  soundEnabled,
  onToggleSound,
  onClose,
}: DesktopWindowTitleBarProps) {
  const getStatusLabel = (s: string) => {
    switch (s) {
      case "online":
        return "Trực tuyến";
      case "away":
        return "Vắng mặt";
      case "busy":
        return "Bận";
      case "invisible":
        return "Ẩn";
      default:
        return "Ngoại tuyến";
    }
  };

  const handleMinimize = () => {
    void window.retroDesktop?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    void window.retroDesktop?.maximizeWindow?.();
  };

  const handleClose = () => {
    if (window.retroDesktop?.closeWindow) {
      void window.retroDesktop.closeWindow();
    } else {
      onClose();
    }
  };

  return (
    <header className="retroWindowBar">
      <div className="retroWindowBrand">
        <YahooLogoIcon size={16} />
        <span className="windowTitleText">
          {title} - {displayName} ({getStatusLabel(status)})
        </span>
      </div>
      <div className="retroWindowControls">
        <button
          className="winControlBtn"
          type="button"
          title={soundEnabled ? "Tắt âm thanh thông báo" : "Bật âm thanh thông báo"}
          aria-label="Bật tắt âm thanh"
          onClick={onToggleSound}
        >
          {soundEnabled ? (
            <IconSpeaker size={12} />
          ) : (
            <IconSpeakerMuted size={12} />
          )}
        </button>
        <button
          className="winControlBtn"
          type="button"
          aria-label="Thu nhỏ"
          title="Thu nhỏ"
          onClick={handleMinimize}
        >
          _
        </button>
        <button
          className="winControlBtn"
          type="button"
          aria-label="Phóng to"
          title="Phóng to"
          onClick={handleMaximize}
        >
          □
        </button>
        <button
          className="winControlBtn closeBtn"
          type="button"
          aria-label="Đóng"
          title="Đóng ứng dụng"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>
    </header>
  );
}

