import { IconBuzz, IconChat, IconRooms, IconPhone, IconPalette } from "../../icons/UiIcons";

export interface AboutDialogProps {
  onClose: () => void;
}

export function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <div className="aboutModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="aboutDialog" onClick={(e) => e.stopPropagation()}>
        <div className="aboutTitleBar">
          <div className="aboutTitleBrand">
            <span className="yIcon">Y!</span>
            <span>About Yahoo! Messenger</span>
          </div>
          <button type="button" className="closeBtn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="aboutBody">
          <div className="aboutBanner">
            <div className="aboutLogo">Y!</div>
            <div className="aboutText">
              <h2>Yahoo! Messenger</h2>
              <p className="aboutVersion">Version 9.0 (Gold Remastered Edition)</p>
              <p className="aboutSubtext">
                Nền tảng nhắn tin hoài niệm thời hoàng kim Yahoo! Messenger
              </p>
            </div>
          </div>

          <div className="aboutDivider" />

          <div className="aboutDetails">
            <p>
              <strong>Kiến trúc & Công nghệ:</strong>
            </p>
            <ul style={{ listStyle: "none", paddingLeft: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
              <li>
                <IconBuzz size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                <strong>Backend:</strong> .NET 10 ASP.NET Core & Wolverine Outbox
              </li>
              <li>
                <IconChat size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                <strong>Realtime:</strong> SignalR WebSockets & MessagePack
              </li>
              <li>
                <IconRooms size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                <strong>Cơ sở dữ liệu:</strong> PostgreSQL & Redis
              </li>
              <li>
                <IconPhone size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                <strong>Voice / Video Call:</strong> LiveKit WebRTC
              </li>
              <li>
                <IconPalette size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
                <strong>Giao diện:</strong> React, Vite, Tahoma Retro Theme & Web Audio
              </li>
            </ul>
            <p className="aboutCopyright">
              © 2005-2026 Retro Messenger Project. Dedicated to the Yahoo! Messenger generation.
            </p>
          </div>

          <div className="aboutFooter">
            <button type="button" className="aboutOkBtn" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

