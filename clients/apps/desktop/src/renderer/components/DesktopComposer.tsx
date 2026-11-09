import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ImvironmentDefinition } from "@retro/design-tokens";
import {
  IconBuzz,
  IconPaperclip,
  IconPalette,
  IconAudibles,
  IconGame,
  IconTheme,
  SmileyHappy,
} from "../icons/DesktopIcons";
import { DesktopEmoticonPicker } from "./DesktopEmoticonPicker";
import { DesktopColorPicker } from "./DesktopColorPicker";
import { DesktopAudiblePicker } from "./DesktopAudiblePicker";
import { DesktopImvironmentPicker } from "./DesktopImvironmentPicker";

export interface DesktopComposerProps {
  disabled: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSendBuzz?: (() => void) | undefined;
  onAttach?: (() => void) | undefined;
  onSendCustomMessage?: ((content: string) => void) | undefined;
  currentImvironmentId?: string | undefined;
  onSelectImvironment?: ((imv: ImvironmentDefinition) => void) | undefined;
  onOpenGame?: (() => void) | undefined;
}

const FONTS = [
  "Tahoma",
  "Arial",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Verdana",
];

const FONT_SIZES = [
  { label: "Nhỏ (9pt)", value: "11px" },
  { label: "Chuẩn (10pt)", value: "13px" },
  { label: "Vừa (12pt)", value: "15px" },
  { label: "Lớn (14pt)", value: "18px" },
];

export function DesktopComposer({
  disabled,
  draft,
  onDraftChange,
  onSubmit,
  onSendBuzz,
  onAttach,
  onSendCustomMessage,
  currentImvironmentId = "classic",
  onSelectImvironment,
  onOpenGame,
}: DesktopComposerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [fontFamily, setFontFamily] = useState("Tahoma");
  const [fontSize, setFontSize] = useState("13px");
  const [fontColor, setFontColor] = useState("#0000cc");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);

  const [showEmoticons, setShowEmoticons] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showAudibles, setShowAudibles] = useState(false);
  const [showImvironments, setShowImvironments] = useState(false);

  // Auto-focus textarea when conversation becomes available
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  // Dynamic auto-expanding height (54px to 120px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 54), 120);
    textarea.style.height = `${newHeight}px`;
  }, [draft]);

  // Click outside and Escape key to close popups
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowEmoticons(false);
        setShowColors(false);
        setShowAudibles(false);
        setShowImvironments(false);
      }
    };

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEmoticons(false);
        setShowColors(false);
        setShowAudibles(false);
        setShowImvironments(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const wrapOrToggle = (prefix: string, suffix: string) => {
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
      if (prefix === "**") setBold((b) => !b);
      else if (prefix === "_") setItalic((i) => !i);
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
        onSendBuzz?.();
        return;
      }
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
      return;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+G: Instant Buzz
    if (isCtrlOrMeta && (e.key === "g" || e.key === "G")) {
      e.preventDefault();
      onSendBuzz?.();
      return;
    }

    // Ctrl+B: Bold toggle / wrap
    if (isCtrlOrMeta && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      wrapOrToggle("**", "**");
      return;
    }

    // Ctrl+I: Italic toggle / wrap
    if (isCtrlOrMeta && (e.key === "i" || e.key === "I")) {
      e.preventDefault();
      wrapOrToggle("_", "_");
      return;
    }

    // Ctrl+U: Underline toggle
    if (isCtrlOrMeta && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      setUnderline((u) => !u);
      return;
    }

    // Ctrl+E: Inline code wrap
    if (isCtrlOrMeta && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      wrapOrToggle("`", "`");
      return;
    }
  };

  const handleInsertEmoticon = (code: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      const space = draft.length > 0 && !draft.endsWith(" ") ? " " : "";
      onDraftChange(`${draft}${space}${code} `);
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

  return (
    <div className="composerWrapper" ref={containerRef}>
      {/* 1. Yahoo Formatting Toolbar */}
      <div className="formatToolbar">
        <select
          className="fontSelect"
          aria-label="Kiểu chữ"
          value={fontFamily}
          disabled={disabled}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          {FONTS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>

        <select
          className="fontSizeSelect"
          aria-label="Cỡ chữ"
          value={fontSize}
          disabled={disabled}
          onChange={(e) => setFontSize(e.target.value)}
        >
          {FONT_SIZES.map((size) => (
            <option key={size.value} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`formatBtn ${bold ? "active" : ""}`}
          title="Chữ đậm (Ctrl+B)"
          disabled={disabled}
          onClick={() => setBold(!bold)}
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          className={`formatBtn ${italic ? "active" : ""}`}
          title="Chữ nghiêng (Ctrl+I)"
          disabled={disabled}
          onClick={() => setItalic(!italic)}
        >
          <em>I</em>
        </button>

        <button
          type="button"
          className={`formatBtn ${underline ? "active" : ""}`}
          title="Gạch chân (Ctrl+U)"
          disabled={disabled}
          onClick={() => setUnderline(!underline)}
        >
          <u>U</u>
        </button>

        <button
          type="button"
          className="formatBtn"
          title="Màu chữ"
          disabled={disabled}
          onClick={() => setShowColors(true)}
        >
          <IconPalette size={14} />
          <span
            className="colorIndicator"
            style={{ backgroundColor: fontColor }}
          />
        </button>

        <div className="toolbarDivider" />

        {/* Emoticon Picker button */}
        <button
          type="button"
          className="formatBtn"
          title="Chọn mặt cười Yahoo!"
          disabled={disabled}
          onClick={() => setShowEmoticons(true)}
        >
          <SmileyHappy size={16} />
        </button>

        {/* Audibles Picker button */}
        <button
          type="button"
          className="formatBtn"
          title="Gửi âm thanh Yahoo! Audibles"
          disabled={disabled}
          onClick={() => setShowAudibles(true)}
        >
          <IconAudibles size={15} />
        </button>

        {/* IMVironments Picker button */}
        {onSelectImvironment && (
          <button
            type="button"
            className="formatBtn"
            title="Đổi chủ đề IMVironments"
            disabled={disabled}
            onClick={() => setShowImvironments(true)}
          >
            <IconTheme size={14} />
          </button>
        )}

        {/* Yahoo! Games button */}
        {onOpenGame && (
          <button
            type="button"
            className="formatBtn"
            title="Yahoo! Games - Chơi cờ Caro"
            disabled={disabled}
            onClick={onOpenGame}
          >
            <IconGame size={14} />
          </button>
        )}

        {/* Attachment button */}
        {onAttach && (
          <button
            type="button"
            className="formatBtn"
            title="Đính kèm tệp tin"
            disabled={disabled}
            onClick={onAttach}
          >
            <IconPaperclip size={14} />
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* BUZZ! Button */}
        {onSendBuzz && (
          <button
            type="button"
            className="buzzActionBtn"
            title="Gửi BUZZ! rung chuyển màn hình đối phương"
            disabled={disabled}
            onClick={onSendBuzz}
          >
            <IconBuzz size={14} />
            <span>BUZZ!</span>
          </button>
        )}
      </div>

      {/* 2. Popups */}
      {showEmoticons && (
        <DesktopEmoticonPicker
          onSelect={handleInsertEmoticon}
          onClose={() => setShowEmoticons(false)}
        />
      )}

      {showColors && (
        <DesktopColorPicker
          currentColor={fontColor}
          onSelectColor={setFontColor}
          onClose={() => setShowColors(false)}
        />
      )}

      {showAudibles && (
        <DesktopAudiblePicker
          onSendAudible={(audibleText) => {
            if (onSendCustomMessage) {
              onSendCustomMessage(audibleText);
            } else {
              onDraftChange(audibleText);
            }
          }}
          onClose={() => setShowAudibles(false)}
        />
      )}

      {showImvironments && onSelectImvironment && (
        <DesktopImvironmentPicker
          currentImvironmentId={currentImvironmentId}
          onSelect={onSelectImvironment}
          onClose={() => setShowImvironments(false)}
        />
      )}

      {/* 3. Message Input Form */}
      <form className="composerArea" onSubmit={onSubmit}>
        <textarea
          ref={textareaRef}
          aria-label="Soạn tin nhắn"
          className="composerInput"
          disabled={disabled}
          maxLength={20_000}
          placeholder={
            disabled
              ? "Hãy chọn một người bạn hoặc hội thoại để trò chuyện…"
              : "Nhập tin nhắn (Enter để gửi, Ctrl+G để Buzz, Shift+Enter xuống dòng)…"
          }
          style={{
            fontFamily,
            fontSize,
            color: fontColor,
            fontWeight: bold ? "bold" : "normal",
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
          }}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="sendButton"
          disabled={disabled || !draft.trim()}
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
