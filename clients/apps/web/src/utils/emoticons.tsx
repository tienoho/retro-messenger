import React, { type ReactNode } from "react";
import { YAHOO_EMOTICONS } from "@retro/design-tokens";
import { getSmileySvg } from "../icons/YahooSmileys";

const urlPattern = /(https?:\/\/[^\s]+)/g;

function renderInlineFormatting(segment: string, keyPrefix: string): ReactNode[] {
  // 1. URLs
  const urlParts = segment.split(urlPattern);
  if (urlParts.length > 1) {
    return urlParts.map((part, idx) => {
      if (urlPattern.test(part)) {
        return (
          <a
            key={`${keyPrefix}-url-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="retroMessageLink"
          >
            {part}
          </a>
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-u${idx}`);
    });
  }

  // 2. Inline code: `code`
  const codeParts = segment.split(/`([^`]+)`/g);
  if (codeParts.length > 1) {
    return codeParts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <code key={`${keyPrefix}-code-${idx}`} className="inlineCode">
            {part}
          </code>
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-c${idx}`);
    });
  }

  // 3. Bold: **text** or *text*
  const boldParts = segment.split(/(?:\*\*([^*]+)\*\*|\*([^*]+)\*)/g);
  if (boldParts.length > 1) {
    return boldParts.filter(Boolean).map((part, idx) => {
      // Bold match if odd
      if (idx % 2 === 1) {
        return (
          <strong key={`${keyPrefix}-b-${idx}`} className="retroBold">
            {part}
          </strong>
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-b${idx}`);
    });
  }

  // 4. Italic: _text_
  const italicParts = segment.split(/_([^_]+)_/g);
  if (italicParts.length > 1) {
    return italicParts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <em key={`${keyPrefix}-i-${idx}`} className="retroItalic">
            {part}
          </em>
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-i${idx}`);
    });
  }

  // 5. Yahoo Emoticons
  const parts: ReactNode[] = [];
  const words = segment.split(" ");
  words.forEach((word, wIdx) => {
    const found = YAHOO_EMOTICONS.find(
      (e) => e.code === word || e.aliases.includes(word),
    );
    if (found) {
      const svg = getSmileySvg(found.code, 18);
      parts.push(
        <span
          key={`${keyPrefix}-emo-${wIdx}`}
          className="inlineEmoticon"
          title={`${found.name} (${found.code})`}
        >
          {svg ?? found.symbol}
        </span>,
      );
    } else {
      parts.push(word);
    }
    if (wIdx < words.length - 1) {
      parts.push(" ");
    }
  });

  return parts;
}

export function renderWithYahooEmoticons(text: string): ReactNode[] {
  // Rocket.Chat feature: Multi-line code blocks ```lang ... ```
  const codeBlockRegex = /```([a-z0-9_-]*)\n?([\s\S]*?)```/g;
  const blocks: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      blocks.push(renderTextParagraphs(before, `blk-${lastIndex}`));
    }
    const codeLang = match[1] || "code";
    const codeContent = match[2]?.trim() ?? "";
    blocks.push(
      <pre key={`codeblock-${match.index}`} className="retroCodeBlock">
        <div className="codeBlockHeader">{codeLang}</div>
        <code>{codeContent}</code>
      </pre>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push(renderTextParagraphs(text.slice(lastIndex), `blk-${lastIndex}`));
  }

  return blocks.length > 0 ? blocks : [text];
}

function renderTextParagraphs(text: string, prefix: string): ReactNode {
  const lines = text.split("\n");
  return (
    <React.Fragment key={prefix}>
      {lines.map((line, lIdx) => {
        // Blockquote: > quote
        if (line.startsWith("> ")) {
          return (
            <blockquote key={`${prefix}-q-${lIdx}`} className="retroQuote">
              {renderInlineFormatting(line.slice(2), `${prefix}-ql-${lIdx}`)}
            </blockquote>
          );
        }
        return (
          <span key={`${prefix}-line-${lIdx}`}>
            {renderInlineFormatting(line, `${prefix}-l-${lIdx}`)}
            {lIdx < lines.length - 1 && <br />}
          </span>
        );
      })}
    </React.Fragment>
  );
}
