import { DESKTOP_EMOTICONS } from "../utils/desktop-messages";
import { getDesktopSmileySvg } from "../icons/DesktopIcons";

export interface DesktopEmoticonPickerProps {
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function DesktopEmoticonPicker({
  onSelect,
  onClose,
}: DesktopEmoticonPickerProps) {
  return (
    <div className="retroPickerBackdrop" onClick={onClose}>
      <div
        className="retroEmoticonPicker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chọn mặt cười Yahoo!"
      >
        <div className="pickerHeader">
          <span>Mặt cười Yahoo! (Emoticons)</span>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="emoticonGrid">
          {DESKTOP_EMOTICONS.map((emo) => (
            <button
              key={emo.code}
              type="button"
              className="emoticonCell"
              title={`${emo.code} (${emo.aliases.join(", ")})`}
              onClick={() => {
                onSelect(emo.code);
                onClose();
              }}
            >
              {getDesktopSmileySvg(emo.code, 22)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

