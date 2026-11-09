export interface DesktopColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

const YAHOO_COLORS = [
  { label: "Xanh Yahoo", color: "#0000cc" },
  { label: "Đỏ Yahoo", color: "#cc0000" },
  { label: "Xanh lá", color: "#008000" },
  { label: "Tím Yahoo", color: "#660099" },
  { label: "Hồng", color: "#ff1493" },
  { label: "Cam", color: "#ff6600" },
  { label: "Xanh ngọc", color: "#008b8b" },
  { label: "Đen", color: "#000000" },
  { label: "Chàm", color: "#4b0082" },
  { label: "Nâu sẫm", color: "#8b4513" },
  { label: "Xanh biển", color: "#1e3a8a" },
  { label: "Xám chì", color: "#475569" },
];

export function DesktopColorPicker({
  currentColor,
  onSelectColor,
  onClose,
}: DesktopColorPickerProps) {
  return (
    <div className="retroPickerBackdrop" onClick={onClose}>
      <div
        className="retroColorPicker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chọn màu chữ"
      >
        <div className="pickerHeader">
          <span>Bảng màu chữ Yahoo!</span>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="colorGrid">
          {YAHOO_COLORS.map(({ label, color }) => (
            <button
              key={color}
              type="button"
              className={`colorSwatch ${currentColor === color ? "selected" : ""}`}
              style={{ backgroundColor: color }}
              title={`${label} (${color})`}
              onClick={() => {
                onSelectColor(color);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

