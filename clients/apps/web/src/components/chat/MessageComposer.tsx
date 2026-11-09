import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import type { AttachmentMetadata } from "@retro/contracts";
import type {
  ImvironmentDefinition,
  YahooAudibleDefinition,
} from "@retro/design-tokens";
import { AttachmentPreviewCard } from "../../features/attachments";
import { FormatToolbar, type ChatFontStyle } from "./FormatToolbar";
import { IconPaperclip } from "../../icons/UiIcons";

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
  onOpenGame?: (() => void) | undefined;
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
  onOpenGame,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-focus textarea when conversation becomes enabled
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  // Dynamic auto-expanding height (48px to 130px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 130);
    textarea.style.height = `${newHeight}px`;
  }, [draft]);

  // Insert emoticon at exact cursor position
  const handleInsertEmoticonAtCursor = (code: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onInsertEmoticon(code);
      return;
    }
    const start = textarea.selectionStart ?? draft.length;
    const end = textarea.selectionEnd ?? draft.length;
    const before = draft.substring(0, start);
    const after = draft.substring(end);
    const needLeadingSpace = before.length > 0 && !before.endsWith(" ");
    const needTrailingSpace = after.length > 0 && !after.startsWith(" ");
    const inserted = `${before}${needLeadingSpace ? " " : ""}${code}${needTrailingSpace ? " " : " "}${after}`;
    onDraftChange(inserted);
    const newPos = start + (needLeadingSpace ? 1 : 0) + code.length + 1;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Keyboard shortcut formatting wrapper
  const wrapOrToggleFormat = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selected = draft.substring(start, end);
      const updated =
        draft.substring(0, start) + prefix + selected + suffix + draft.substring(end);
      onDraftChange(updated);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      if (prefix === "**") onFontStyleChange((p) => ({ ...p, bold: !p.bold }));
      else if (prefix === "_") onFontStyleChange((p) => ({ ...p, italic: !p.italic }));
      else if (prefix === "`") {
        const updated = draft.substring(0, start) + "``" + draft.substring(end);
        onDraftChange(updated);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim() === "/buzz") {
        onDraftChange("");
        onSendBuzz();
        return;
      }
      void onSend();
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+G: Instant Buzz
    if (isCtrlOrMeta && (e.key === "g" || e.key === "G")) {
      e.preventDefault();
      onSendBuzz();
      return;
    }

    // Ctrl+B: Bold toggle / wrap
    if (isCtrlOrMeta && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      wrapOrToggleFormat("**", "**");
      return;
    }

    // Ctrl+I: Italic toggle / wrap
    if (isCtrlOrMeta && (e.key === "i" || e.key === "I")) {
      e.preventDefault();
      wrapOrToggleFormat("_", "_");
      return;
    }

    // Ctrl+U: Underline toggle
    if (isCtrlOrMeta && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      onFontStyleChange((p) => ({ ...p, underline: !p.underline }));
      return;
    }

    // Ctrl+E: Inline code wrapper
    if (isCtrlOrMeta && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      wrapOrToggleFormat("`", "`");
      return;
    }

    // Ctrl+Shift+C: Multiline code block wrapper
    if (isCtrlOrMeta && e.shiftKey && (e.key === "c" || e.key === "C")) {
      e.preventDefault();
      wrapOrToggleFormat("```\n", "\n```");
      return;
    }
  };

  // Clipboard paste: Directly upload pasted images/screenshots (Ctrl+V)
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          onFileSelect(file);
          return;
        }
      }
    }
  };

  // Drag and drop file handling
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draft.trim() === "/buzz") {
      onDraftChange("");
      onSendBuzz();
      return;
    }
    void onSend();
  };

  return (
    <div
      className={`composerWrapper ${isDragOver ? "dragActive" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="composerDropOverlay">
          <IconPaperclip size={20} style={{ marginRight: 8, verticalAlign: "middle" }} />
          <span>Thả tập tin tại đây để gửi qua Yahoo! Messenger</span>
        </div>
      )}

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
        onInsertEmoticon={handleInsertEmoticonAtCursor}
        onSendAudible={onSendAudible}
        currentImvironmentId={currentImvironmentId}
        onSelectImvironment={onSelectImvironment}
        onSendBuzz={onSendBuzz}
        buzzCooldownSeconds={buzzCooldownSeconds}
        onFileSelect={onFileSelect}
        onOpenGame={onOpenGame}
        disabled={disabled}
        isUploading={isUploading}
      />

      <form className="composerArea" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
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
          onPaste={handlePaste}
          placeholder={
            disabled
              ? "Hãy chọn một người bạn hoặc phòng trò chuyện..."
              : "Nhập tin nhắn (Enter để gửi, Ctrl+G để Buzz, Ctrl+V dán ảnh)..."
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
    </div>
  );
}
