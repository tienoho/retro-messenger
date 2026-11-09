import { IconSpeaker, IconSpeakerMuted } from "../../icons/UiIcons";

export interface WindowTitleBarProps {
  title?: string;
  isOnline: boolean;
  soundEnabled?: boolean | undefined;
  onToggleSound?: (() => void) | undefined;
  onLogout: () => void;
}

export function WindowTitleBar({
  title = "Yahoo! Messenger",
  isOnline,
  soundEnabled = true,
  onToggleSound,
  onLogout,
}: WindowTitleBarProps) {
  return (
    <header className="retroWindowBar">
      <div className="retroWindowBrand">
        <span className="badgeIcon">Y!</span>
        <span className="windowTitleText">{title}</span>
        {!isOnline && (
          <span style={{ fontSize: "10px", color: "#ffd700", marginLeft: 8 }}>
            (Đang ngoại tuyến)
          </span>
        )}
      </div>
      <div className="retroWindowControls">
        {onToggleSound && (
          <button
            className="winControlBtn"
            type="button"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            aria-label="Toggle sound"
            onClick={onToggleSound}
          >
            {soundEnabled ? <IconSpeaker size={12} /> : <IconSpeakerMuted size={12} />}
          </button>
        )}
        <button className="winControlBtn" type="button" aria-label="Minimize">
          _
        </button>
        <button className="winControlBtn" type="button" aria-label="Maximize">
          □
        </button>
        <button
          className="winControlBtn closeBtn"
          type="button"
          aria-label="Thoát"
          title="Đăng xuất"
          onClick={onLogout}
        >
          ✕
        </button>
      </div>
    </header>
  );
}
