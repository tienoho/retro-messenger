import type { FormEvent } from "react";

export interface DesktopComposerProps {
  disabled: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function DesktopComposer({
  disabled,
  draft,
  onDraftChange,
  onSubmit,
}: DesktopComposerProps) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <input
        aria-label="Tin nhắn"
        disabled={disabled}
        maxLength={20_000}
        placeholder={disabled ? "Chọn một cuộc trò chuyện" : "Nhập tin nhắn…"}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
      />
      <button
        type="submit"
        className="sendButton"
        disabled={disabled || !draft.trim()}
      >
        Gửi
      </button>
    </form>
  );
}

