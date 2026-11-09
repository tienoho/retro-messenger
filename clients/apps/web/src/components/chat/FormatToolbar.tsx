import { useState } from "react";
import {
  YAHOO_FONTS,
  YAHOO_FONT_SIZES,
  type ImvironmentDefinition,
  type YahooAudibleDefinition,
} from "@retro/design-tokens";
import { SmileyHappy } from "../../icons/YahooSmileys";
import { IconAudibles, IconPalette, IconBuzz, IconGame } from "../../icons/UiIcons";
import { AttachmentPicker } from "../../features/attachments";
import { EmoticonPicker } from "./EmoticonPicker";
import { AudiblePicker } from "./AudiblePicker";
import { ImvironmentPicker } from "./ImvironmentPicker";
import { FontColorPicker } from "./FontColorPicker";

export interface ChatFontStyle {
  fontFamily: string;
  fontSize: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface FormatToolbarProps {
  fontStyle: ChatFontStyle;
  onFontStyleChange: (updater: (prev: ChatFontStyle) => ChatFontStyle) => void;
  onInsertEmoticon: (code: string) => void;
  onSendAudible: (audible: YahooAudibleDefinition) => void;
  currentImvironmentId: string;
  onSelectImvironment: (imv: ImvironmentDefinition) => void;
  onSendBuzz: () => void;
  buzzCooldownSeconds?: number | undefined;
  onFileSelect: (file: File) => void;
  onOpenGame?: (() => void) | undefined;
  disabled: boolean;
  isUploading: boolean;
}

export function FormatToolbar({
  fontStyle,
  onFontStyleChange,
  onInsertEmoticon,
  onSendAudible,
  currentImvironmentId,
  onSelectImvironment,
  onSendBuzz,
  buzzCooldownSeconds = 0,
  onFileSelect,
  onOpenGame,
  disabled,
  isUploading,
}: FormatToolbarProps) {
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [showAudibles, setShowAudibles] = useState(false);
  const [showImvironment, setShowImvironment] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toggleBold = () => {
    onFontStyleChange((prev) => ({ ...prev, bold: !prev.bold }));
  };

  const toggleItalic = () => {
    onFontStyleChange((prev) => ({ ...prev, italic: !prev.italic }));
  };

  const toggleUnderline = () => {
    onFontStyleChange((prev) => ({ ...prev, underline: !prev.underline }));
  };

  const isBuzzCooling = buzzCooldownSeconds > 0;

  return (
    <div className="formatToolbar">
      {/* Font Family selector */}
      <select
        className="fontSelect"
        aria-label="Kiểu chữ"
        value={fontStyle.fontFamily}
        disabled={disabled}
        onChange={(e) =>
          onFontStyleChange((prev) => ({ ...prev, fontFamily: e.target.value }))
        }
      >
        {YAHOO_FONTS.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      {/* Font Size selector */}
      <select
        className="fontSizeSelect"
        aria-label="Cỡ chữ"
        value={fontStyle.fontSize}
        disabled={disabled}
        onChange={(e) =>
          onFontStyleChange((prev) => ({ ...prev, fontSize: e.target.value }))
        }
      >
        {YAHOO_FONT_SIZES.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label}
          </option>
        ))}
      </select>

      {/* Color picker button */}
      <button
        type="button"
        className="colorPickerBtn"
        title="Chọn màu chữ"
        disabled={disabled}
        onClick={() => setShowColorPicker((prev) => !prev)}
      >
        <span
          className="colorIndicator"
          style={{ backgroundColor: fontStyle.color }}
        />
        <span>Màu ▼</span>
      </button>

      {/* Format styling toggles */}
      <button
        type="button"
        className={`formatBtn ${fontStyle.bold ? "active" : ""}`}
        title="In đậm (Bold)"
        disabled={disabled}
        onClick={toggleBold}
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={`formatBtn ${fontStyle.italic ? "active" : ""}`}
        title="In nghiêng (Italic)"
        disabled={disabled}
        onClick={toggleItalic}
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={`formatBtn ${fontStyle.underline ? "active" : ""}`}
        title="Gạch chân (Underline)"
        disabled={disabled}
        onClick={toggleUnderline}
      >
        <u>U</u>
      </button>

      <span className="toolbarSeparator" />

      {/* Emoticons toggle */}
      <button
        type="button"
        className="emoticonToggleBtn"
        title="Biểu tượng cảm xúc Yahoo!"
        onClick={() => {
          setShowEmoticons((prev) => !prev);
          setShowAudibles(false);
          setShowImvironment(false);
          setShowColorPicker(false);
        }}
        disabled={disabled}
      >
        <SmileyHappy size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
        Biểu cảm ▼
      </button>

      {/* Audibles toggle */}
      <button
        type="button"
        className="audibleToggleBtn"
        title="Yahoo! Audibles - Lời chào âm thanh"
        onClick={() => {
          setShowAudibles((prev) => !prev);
          setShowEmoticons(false);
          setShowImvironment(false);
          setShowColorPicker(false);
        }}
        disabled={disabled}
      >
        <IconAudibles size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
        Audibles ▼
      </button>

      {/* IMVironment toggle */}
      <button
        type="button"
        className="imvToggleBtn"
        title="Chọn phông nền IMVironment"
        onClick={() => {
          setShowImvironment((prev) => !prev);
          setShowEmoticons(false);
          setShowAudibles(false);
          setShowColorPicker(false);
        }}
        disabled={disabled}
      >
        <IconPalette size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
        IMVironment ▼
      </button>

      {/* Yahoo! Games toggle */}
      {onOpenGame && (
        <button
          type="button"
          className="imvToggleBtn"
          title="Yahoo! Games - Chơi cờ Caro cùng bạn bè"
          disabled={disabled}
          onClick={onOpenGame}
        >
          <IconGame size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
          Trò chơi
        </button>
      )}

      {/* Attachment */}
      <AttachmentPicker
        onFileSelect={onFileSelect}
        disabled={isUploading || disabled}
      />

      {/* BUZZ! Button */}
      <button
        type="button"
        className="buzzButton"
        title={
          isBuzzCooling
            ? `Vui lòng đợi ${buzzCooldownSeconds}s để Buzz tiếp`
            : "Rung chuông BUZZ! gây chú ý"
        }
        disabled={disabled || isBuzzCooling}
        onClick={onSendBuzz}
      >
        <IconBuzz size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />
        {isBuzzCooling ? `BUZZ (${buzzCooldownSeconds}s)` : "BUZZ!"}
      </button>

      {/* Popups */}
      {showEmoticons && (
        <EmoticonPicker
          onSelect={(code) => {
            onInsertEmoticon(code);
            setShowEmoticons(false);
          }}
        />
      )}

      {showAudibles && (
        <AudiblePicker
          onSelectAudible={onSendAudible}
          onClose={() => setShowAudibles(false)}
        />
      )}

      {showImvironment && (
        <ImvironmentPicker
          currentId={currentImvironmentId}
          onSelect={onSelectImvironment}
          onClose={() => setShowImvironment(false)}
        />
      )}

      {showColorPicker && (
        <FontColorPicker
          currentColor={fontStyle.color}
          onSelectColor={(color) => {
            onFontStyleChange((prev) => ({ ...prev, color }));
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
