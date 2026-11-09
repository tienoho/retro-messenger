import { useState } from "react";
import { YAHOO_MUSIC_STATUSES } from "@retro/design-tokens";
import { IconPencil } from "../icons/DesktopIcons";

export interface DesktopCustomStatusDialogProps {
  currentCustomStatus?: string | null | undefined;
  onSave: (customStatus: string | null) => Promise<void>;
  onClose: () => void;
}

const PRESETS = [
  "Đang bận học bài / làm việc",
  "AFK đi ăn cơm tí về…",
  "Cuối tuần vi vu cà phê bạn bè (~~)",
  "Đang hoài niệm Yahoo! Messenger 2000s",
  "Tâm trạng đang vui, buzz cái nói chuyện! :-D",
];

export function DesktopCustomStatusDialog({
  currentCustomStatus,
  onSave,
  onClose,
}: DesktopCustomStatusDialogProps) {
  const [text, setText] = useState(currentCustomStatus ?? "");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(text.trim() ? text.trim() : null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    try {
      await onSave(null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="retroModalBackdrop" onClick={onClose}>
      <div
        className="retroModalDialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="customStatusTitle"
      >
        <div className="retroModalHeader">
          <div className="retroModalTitle">
            <IconPencil size={14} style={{ marginRight: 6 }} />
            <span id="customStatusTitle">Đổi lời nhắn trạng thái</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="retroModalBody">
          <label htmlFor="customStatusInput" className="retroFieldLabel">
            Nhập lời nhắn cá nhân của bạn (tối đa 100 ký tự):
          </label>
          <input
            id="customStatusInput"
            type="text"
            className="retroInput"
            maxLength={100}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Đang bận làm việc, đừng buzz nha…"
            autoFocus
          />

          <div className="presetSection">
            <div className="presetHeader">Hoặc chọn nhanh lời nhắn gợi ý:</div>
            <div className="presetList">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="presetItem"
                  onClick={() => setText(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="presetSection">
            <div className="presetHeader">♫ Hoặc trạng thái &ldquo;Đang nghe nhạc&rdquo; (2000s Hits):</div>
            <div className="presetList">
              {YAHOO_MUSIC_STATUSES.map((song) => (
                <button
                  key={song}
                  type="button"
                  className="presetItem musicItem"
                  onClick={() => setText(song)}
                >
                  {song}
                </button>
              ))}
            </div>
          </div>

          <div className="retroModalActions">
            {currentCustomStatus && (
              <button
                type="button"
                className="retroBtn danger"
                disabled={busy}
                onClick={() => void handleClear()}
              >
                Xóa lời nhắn
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="retroBtn"
              disabled={busy}
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="retroBtn primary"
              disabled={busy}
            >
              Lưu lời nhắn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

