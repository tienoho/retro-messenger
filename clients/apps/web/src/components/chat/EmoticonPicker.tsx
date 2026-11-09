import { YAHOO_EMOTICONS } from "@retro/design-tokens";
import { getSmileySvg } from "../../icons/YahooSmileys";

export interface EmoticonPickerProps {
  onSelect: (code: string) => void;
}

export function EmoticonPicker({ onSelect }: EmoticonPickerProps) {
  return (
    <div
      className="emoticonGridPopup"
      role="dialog"
      aria-label="Bảng chọn biểu tượng cảm xúc Yahoo!"
    >
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
  );
}
