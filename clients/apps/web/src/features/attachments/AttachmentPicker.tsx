import React, { useRef } from "react";
import { IconPaperclip } from "../../icons/UiIcons";

export interface AttachmentPickerProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function AttachmentPicker({
  onFileSelect,
  disabled = false,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="attachmentPicker">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        style={{ display: "none" }}
        data-testid="file-input"
      />
      <button
        type="button"
        className="attachBtn"
        onClick={handleClick}
        disabled={disabled}
        title="Đính kèm tệp tin"
      >
        <IconPaperclip size={13} style={{ marginRight: 3, verticalAlign: "middle" }} />
        Tệp
      </button>
    </div>
  );
}
