import {
  YAHOO_IMVIRONMENTS,
  type ImvironmentDefinition,
} from "@retro/design-tokens";

export interface ImvironmentPickerProps {
  currentId: string;
  onSelect: (imv: ImvironmentDefinition) => void;
  onClose: () => void;
}

export function ImvironmentPicker({
  currentId,
  onSelect,
  onClose,
}: ImvironmentPickerProps) {
  return (
    <div
      className="imvironmentGridPopup"
      role="dialog"
      aria-label="Chọn chủ đề IMVironment"
    >
      <div className="imvironmentHeader">
        <span>IMVironment Themes</span>
        <button type="button" className="closePopupBtn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="imvironmentList">
        {YAHOO_IMVIRONMENTS.map((imv) => (
          <button
            key={imv.id}
            type="button"
            className={`imvironmentItem ${currentId === imv.id ? "active" : ""}`}
            onClick={() => {
              onSelect(imv);
              onClose();
            }}
          >
            <span
              className="imvSwatch"
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                background: imv.background,
                border: "1px solid #7f9db9",
                display: "inline-block",
                marginRight: 6,
                verticalAlign: "middle",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            />
            <span className="imvName">{imv.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

