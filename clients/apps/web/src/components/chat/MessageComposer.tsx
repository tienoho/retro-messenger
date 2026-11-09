import type { FormEvent, KeyboardEvent } from "react";
import type { AttachmentMetadata } from "@retro/contracts";
import type {
  ImvironmentDefinition,
  YahooAudibleDefinition,
} from "@retro/design-tokens";
import { AttachmentPreviewCard } from "../../features/attachments";
import { FormatToolbar, type ChatFontStyle } from "./FormatToolbar";

export interface MessageComposerProps {
  draft: string;
  fontStyle: ChatFontStyle;
  onFontStyleChange: (updater: (prev: ChatFontStyle) => ChatFontStyle) => void;
  onDraftChange: (text: string) => void;
  onSend: () => Promise<void>;
  onSendBuzz: () => void;
  buzzCooldownSeconds?: number | undefined;
  onInsertEmoticon: (code: string) => void;
  onSendAudible: (audible: YahooAudibleDefinition) => void;
  currentImvironmentId: string;
  onSelectImvironment: (imv: ImvironmentDefinition) => void;
  onFileSelect: (file: File) => void;
  disabled: boolean;
  isUploading: boolean;
  attachments: AttachmentMetadata[];
  onRemoveAttachment: (id: string) => void;
  mediaError: string | null;
}

export function MessageComposer({
  draft,
  fontStyle,
  onFontStyleChange,
  onDraftChange,
  onSend,
  onSendBuzz,
  buzzCooldownSeconds = 0,
  onInsertEmoticon,
  onSendAudible,
  currentImvironmentId,
  onSelectImvironment,
  onFileSelect,
  disabled,
  isUploading,
  attachments,
  onRemoveAttachment,
  mediaError,
}: MessageComposerProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSend();
  };

  return (
    <>
      {attachments.length > 0 && (
        <div className="composerAttachments">
          {attachments.map((att) => (
            <AttachmentPreviewCard
              key={att.id}
              attachment={att}
              onRemove={onRemoveAttachment}
            />
          ))}
        </div>
      )}

      {mediaError && (
        <p className="mediaError" role="alert">
          {mediaError}
        </p>
      )}

      <FormatToolbar
        fontStyle={fontStyle}
        onFontStyleChange={onFontStyleChange}
        onInsertEmoticon={onInsertEmoticon}
        onSendAudible={onSendAudible}
        currentImvironmentId={currentImvironmentId}
        onSelectImvironment={onSelectImvironment}
        onSendBuzz={onSendBuzz}
        buzzCooldownSeconds={buzzCooldownSeconds}
        onFileSelect={onFileSelect}
        disabled={disabled}
        isUploading={isUploading}
      />

      <form className="composerArea" onSubmit={handleSubmit}>
        <textarea
          className="composerInput"
          style={{
            fontFamily: fontStyle.fontFamily,
            fontSize: fontStyle.fontSize,
            color: fontStyle.color,
            fontWeight: fontStyle.bold ? "bold" : "normal",
            fontStyle: fontStyle.italic ? "italic" : "normal",
            textDecoration: fontStyle.underline ? "underline" : "none",
          }}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "Hãy chọn một người bạn hoặc phòng trò chuyện..."
              : "Nhập tin nhắn (nhấn Enter để gửi)..."
          }
          disabled={disabled}
        />
        <button
          type="submit"
          className="sendBtn"
          disabled={disabled || (!draft.trim() && attachments.length === 0)}
        >
          Gửi
        </button>
      </form>
    </>
  );
}
