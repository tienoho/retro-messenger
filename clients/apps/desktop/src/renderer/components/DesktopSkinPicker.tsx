import {
  YAHOO_SKINS,
  type YahooSkinDefinition,
} from "@retro/design-tokens";
import { IconPalette } from "../icons/DesktopIcons";

export interface DesktopSkinPickerProps {
  currentSkinId: string;
  onSelectSkin: (skin: YahooSkinDefinition) => void;
  onClose: () => void;
}

export function DesktopSkinPicker({
  currentSkinId,
  onSelectSkin,
  onClose,
}: DesktopSkinPickerProps) {
  return (
    <div className="retroModalBackdrop" onClick={onClose}>
      <div
        className="retroModalDialog skinBox"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Đổi giao diện Yahoo! Messenger"
      >
        <div className="retroModalHeader">
          <div className="retroModalTitle">
            <IconPalette size={14} style={{ marginRight: 6 }} />
            <span>Đổi giao diện (Yahoo! Messenger Skins)</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="retroModalBody skinContent">
          <div className="skinGrid">
            {YAHOO_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                className={`skinCard ${currentSkinId === skin.id ? "selected" : ""}`}
                onClick={() => {
                  onSelectSkin(skin);
                  onClose();
                }}
              >
                <div
                  className="skinBarPreview"
                  style={{ background: skin.primaryGradient }}
                />
                <div
                  className="skinBodyPreview"
                  style={{ background: skin.windowBg }}
                >
                  <div
                    className="skinAccentDot"
                    style={{ background: skin.accent }}
                  />
                  <span className="skinName">{skin.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="retroModalActions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="retroBtn" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

