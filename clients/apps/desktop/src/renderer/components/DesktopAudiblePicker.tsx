import { IconAudibles } from "../icons/DesktopIcons";

export interface DesktopAudiblePickerProps {
  onSendAudible: (text: string) => void;
  onClose: () => void;
}

const AUDIBLES = [
  { id: "buzz", title: "BUZZ!!! (Rung chuông)", text: "BUZZ!!!" },
  { id: "hey", title: "Hey! Có ai ở đó không?!", text: "[Audible] Hey! Có ai ở đó không?!" },
  { id: "missyou", title: "Nhớ bạn quá nè!", text: "[Audible] Nhớ bạn quá nè!" },
  { id: "woohoo", title: "WooHoo!! Tuyệt vời quá!", text: "[Audible] WooHoo!! Tuyệt vời quá!" },
  { id: "laugh", title: "Hahaha! Đau cả bụng =))", text: "[Audible] Hahaha! Đau cả bụng =))" },
  { id: "byebye", title: "Bye Bye! Tạm biệt nhé!", text: "[Audible] Bye Bye! Tạm biệt nhé!" },
];

export function DesktopAudiblePicker({
  onSendAudible,
  onClose,
}: DesktopAudiblePickerProps) {
  return (
    <div className="retroPickerBackdrop" onClick={onClose}>
      <div
        className="retroAudiblePicker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Chọn Yahoo! Audibles"
      >
        <div className="pickerHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IconAudibles size={14} />
            <span>Yahoo! Audibles âm thanh</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="audibleList">
          {AUDIBLES.map((aud) => (
            <button
              key={aud.id}
              type="button"
              className="audibleItem"
              onClick={() => {
                onSendAudible(aud.text);
                onClose();
              }}
            >
              {aud.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

