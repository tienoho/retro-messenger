import {
  YAHOO_IMVIRONMENTS,
  type ImvironmentDefinition,
} from "@retro/design-tokens";
import { IconPalette } from "../icons/DesktopIcons";

export interface DesktopImvironmentPickerProps {
  currentImvironmentId: string;
  onSelect: (imv: ImvironmentDefinition) => void;
  onClose: () => void;
}

export function DesktopImvironmentPicker({
  currentImvironmentId,
  onSelect,
  onClose,
}: DesktopImvironmentPickerProps) {
  return (
    <div className="retroPickerBackdrop" onClick={onClose}>
      <div
        className="retroImvPicker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chọn chủ đề IMVironment"
      >
        <div className="pickerHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconPalette size={14} />
            <span>Chủ đề IMVironments</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="imvGrid">
          {YAHOO_IMVIRONMENTS.map((imv) => (
            <button
              key={imv.id}
              type="button"
              className={`imvCard ${currentImvironmentId === imv.id ? "active" : ""}`}
              onClick={() => {
                onSelect(imv);
                onClose();
              }}
            >
              <div
                className="imvPreview"
                style={{ background: imv.background }}
              >
                <span
                  style={{
                    color: imv.textColor ?? "#222222",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Y!
                </span>
              </div>
              <span className="imvTitle">{imv.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

