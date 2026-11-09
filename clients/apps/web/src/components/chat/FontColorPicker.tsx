import { YAHOO_TEXT_COLORS } from "@retro/design-tokens";

export interface FontColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

export function FontColorPicker({
  currentColor,
  onSelectColor,
  onClose,
}: FontColorPickerProps) {
  return (
    <div
      className="fontColorPopup"
      role="dialog"
      aria-label="Bảng chọn màu chữ Yahoo"
    >
      <div className="fontColorHeader">
        <span>Màu chữ</span>
        <button type="button" className="closePopupBtn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="colorPaletteGrid">
        {YAHOO_TEXT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`colorSwatch ${currentColor === color ? "active" : ""}`}
            style={{ backgroundColor: color }}
            title={color}
            onClick={() => {
              onSelectColor(color);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}

