import { YAHOO_EMOTICONS } from "@retro/design-tokens";
import { getSmileySvg, SmileyHappy } from "../../icons/YahooSmileys";

export interface EmoticonPickerProps {
  onSelect: (code: string) => void;
  onClose?: (() => void) | undefined;
}

export function EmoticonPicker({ onSelect, onClose }: EmoticonPickerProps) {
  return (
    <div
      className="emoticonGridPopup"
      role="dialog"
      aria-label="Bảng chọn biểu tượng cảm xúc Yahoo!"
    >
      <div className="popupHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px", borderBottom: "1px solid #dcdcdc", background: "#f5f3f7", fontSize: "11px", fontWeight: "bold", color: "#5b1e84" }}>
        <span>
          <SmileyHappy size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Biểu tượng Yahoo!
        </span>
        {onClose && (
          <button
            type="button"
            className="closePopupBtn"
            onClick={onClose}
            title="Đóng bảng biểu tượng"
            style={{ border: "none", background: "none", cursor: "pointer", fontWeight: "bold", color: "#888" }}
          >
            ✕
          </button>
        )}
      </div>
      <div className="emoticonGridBody" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", padding: "6px" }}>
        {YAHOO_EMOTICONS.map((emo) => (
          <button
            key={emo.code}
            type="button"
            className="emoticonGridItem"
            title={`${emo.name} (${emo.code})`}
            onClick={() => onSelect(emo.code)}
          >
            {getSmileySvg(emo.code, 22) ?? emo.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
