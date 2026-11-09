import { YahooLogoIcon } from "../icons/DesktopIcons";

export interface DesktopAboutDialogProps {
  onClose: () => void;
}

export function DesktopAboutDialog({ onClose }: DesktopAboutDialogProps) {
  return (
    <div className="retroModalBackdrop" onClick={onClose}>
      <div
        className="retroModalDialog aboutBox"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="aboutTitle"
      >
        <div className="retroModalHeader">
          <div className="retroModalTitle">
            <YahooLogoIcon size={14} style={{ marginRight: 6 }} />
            <span id="aboutTitle">Giới thiệu Retro Yahoo! Messenger</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="retroModalBody aboutContent">
          <div className="aboutBrandStrip">
            <div className="aboutBigIcon">
              <YahooLogoIcon size={36} />
            </div>
            <div>
              <h2 className="aboutHeading">Retro Yahoo! Messenger</h2>
              <div className="aboutVersion">Phiên bản 9.0 (Nostalgia Edition)</div>
            </div>
          </div>

          <div className="aboutText">
            <p>
              Tái hiện trọn vẹn ký ức Yahoo! Messenger huyền thoại đầu những năm 2000s:
            </p>
            <ul>
              <li>Rung màn hình với âm thanh BUZZ! đặc trưng</li>
              <li>Bộ 32 mặt cười Yahoo kinh điển vẽ hoàn toàn bằng vector SVG sắc nét</li>
              <li>Âm thanh báo tin nhắn, chuông ding và âm thanh mở cửa Yahoo</li>
              <li>Gọi webcam P2P & thoại Audio trực tiếp mượt mà qua LiveKit</li>
              <li>Môi trường chat IMVironments và giao diện Skins cổ điển phong phú</li>
              <li>Trò chơi cờ Caro (Yahoo! Games) giao lưu trực tiếp</li>
            </ul>
            <p className="copyright">
              Bản quyền © 2026 Retro Messenger Project. Được phát triển với tình yêu dành cho thời kỳ hoàng kim của chat Yahoo!
            </p>
          </div>

          <div className="retroModalActions" style={{ justifyContent: "flex-end" }}>
            <button
              type="button"
              className="retroBtn primary"
              onClick={onClose}
              autoFocus
            >
              Đóng (OK)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

