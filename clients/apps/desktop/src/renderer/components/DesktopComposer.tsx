import { useState, type FormEvent, type KeyboardEvent } from "react";
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleInsertEmoticon = (code: string) => {
    const space = draft.length > 0 && !draft.endsWith(" ") ? " " : "";
    onDraftChange(`${draft}${space}${code} `);
  };

  return (
    <div className="composerWrapper">
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
          aria-label="Soạn tin nhắn"
          className="composerInput"
          disabled={disabled}
          maxLength={20_000}
          placeholder={
            disabled
              ? "Hãy chọn một người bạn hoặc hội thoại để trò chuyện…"
              : "Nhập tin nhắn (Nhấn Enter để gửi, Shift+Enter để xuống dòng)…"
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
