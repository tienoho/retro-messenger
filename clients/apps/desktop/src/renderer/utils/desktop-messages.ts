import React, { type ReactNode } from "react";
import type { MessageDto } from "@retro/contracts";
import { getDesktopSmileySvg } from "../icons/DesktopIcons";

export const attachmentPattern =
  /^(?:\[attachment:([0-9a-f-]{36})\]|\uD83D\uDCCE)\s*(.+?)(?:\nattachment:([0-9a-f-]{36}))?$/i;

export interface DesktopEmoticon {
  code: string;
  symbol: string;
  aliases: string[];
}

export const DESKTOP_EMOTICONS: DesktopEmoticon[] = [
  { code: ":)", symbol: ":)", aliases: [":-)"] },
  { code: ":(", symbol: ":(", aliases: [":-("] },
  { code: ";)", symbol: ";)", aliases: [";-)"] },
  { code: ":D", symbol: ":D", aliases: [":-D", ":d"] },
  { code: ";;)", symbol: ";;)", aliases: [] },
  { code: ">:D<", symbol: ">:D<", aliases: [] },
  { code: ":-/", symbol: ":-/", aliases: [":/"] },
  { code: ":x", symbol: ":x", aliases: [":X", ":-x", ":-X"] },
  { code: ':">', symbol: ':">', aliases: [] },
  { code: ":P", symbol: ":P", aliases: [":-P", ":p", ":-p"] },
  { code: ":-*", symbol: ":-*", aliases: [":*"] },
  { code: "=((", symbol: "=((", aliases: [":'(", ":-("] },
  { code: ":-O", symbol: ":-O", aliases: [":O", ":o", ":-o"] },
  { code: "X(", symbol: "X(", aliases: ["x(", ":-t"] },
  { code: "B-)", symbol: "B-)", aliases: ["b-)"] },
  { code: ":-SS", symbol: ":-SS", aliases: [":-ss", ":SS", ":ss"] },
  { code: "=))", symbol: "=))", aliases: [] },
  { code: "O:-)", symbol: "O:-)", aliases: ["o:-)", "0:-)"] },
  { code: ">:)", symbol: ">:)", aliases: [">:-)"] },
  { code: ":-B", symbol: ":-B", aliases: [":-b"] },
  { code: "^:)^", symbol: "^:)^", aliases: [] },
  { code: ":>", symbol: ":>", aliases: [] },
  { code: ":-<", symbol: ":-<", aliases: [] },
  { code: "~:>", symbol: "~:>", aliases: [] },
  { code: "@};-", symbol: "@};-", aliases: [] },
  { code: "%%-", symbol: "%%-", aliases: [] },
  { code: "**==", symbol: "**==", aliases: [] },
  { code: "(~~)", symbol: "(~~)", aliases: [] },
  { code: "~O)", symbol: "~O)", aliases: [] },
  { code: "*-:)", symbol: "*-:)", aliases: [] },
  { code: "8-X", symbol: "8-X", aliases: ["8-x"] },
  { code: "(BUZZ)", symbol: "(BUZZ)", aliases: ["buzz", "BUZZ!"] },
];

export function mergeMessages(
  current: MessageDto[],
  incoming: MessageDto[],
): MessageDto[] {
  const all = [...current];

  for (const item of incoming) {
    const index = all.findIndex(
      (existing) =>
        existing.id === item.id ||
        (item.clientMessageId &&
          existing.clientMessageId === item.clientMessageId) ||
        (item.clientMessageId && existing.id === item.clientMessageId) ||
        (existing.clientMessageId && existing.clientMessageId === item.id),
    );

    if (index !== -1) {
      all[index] = item;
    } else {
      all.push(item);
    }
  }

  // Prioritize authoritative server records (where id !== clientMessageId) over local optimistic placeholders
  all.sort((a, b) => {
    const aIsServer = a.clientMessageId ? a.id !== a.clientMessageId : true;
    const bIsServer = b.clientMessageId ? b.id !== b.clientMessageId : true;
    if (aIsServer !== bIsServer) {
      return aIsServer ? -1 : 1;
    }
    return a.sequence - b.sequence;
  });

  const finalMessages: MessageDto[] = [];
  const seenIds = new Set<string>();
  const seenClientIds = new Set<string>();

  for (const msg of all) {
    if (seenIds.has(msg.id)) continue;
    if (msg.clientMessageId && seenClientIds.has(msg.clientMessageId)) continue;

    seenIds.add(msg.id);
    if (msg.clientMessageId) {
      seenClientIds.add(msg.clientMessageId);
      seenIds.add(msg.clientMessageId);
    }
    finalMessages.push(msg);
  }

  return finalMessages.sort((a, b) => a.sequence - b.sequence);
}

const urlPattern = /(https?:\/\/[^\s]+)/g;

function renderInlineFormatting(segment: string, keyPrefix: string): ReactNode[] {
  // URLs
  const urlParts = segment.split(urlPattern);
  if (urlParts.length > 1) {
    return urlParts.map((part, idx) => {
      if (urlPattern.test(part)) {
        return React.createElement(
          "a",
          {
            key: `${keyPrefix}-url-${idx}`,
            href: part,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "retroMessageLink",
          },
          part,
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-u${idx}`);
    });
  }

  // Inline code: `code`
  const codeParts = segment.split(/`([^`]+)`/g);
  if (codeParts.length > 1) {
    return codeParts.map((part, idx) => {
      if (idx % 2 === 1) {
        return React.createElement(
          "code",
          { key: `${keyPrefix}-code-${idx}`, className: "inlineCode" },
          part,
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-c${idx}`);
    });
  }

  // Bold: **text** or *text*
  const boldParts = segment.split(/(?:\*\*([^*]+)\*\*|\*([^*]+)\*)/g);
  if (boldParts.length > 1) {
    return boldParts.filter(Boolean).map((part, idx) => {
      if (idx % 2 === 1) {
        return React.createElement(
          "strong",
          { key: `${keyPrefix}-b-${idx}`, className: "retroBold" },
          part,
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-b${idx}`);
    });
  }

  // Italic: _text_
  const italicParts = segment.split(/_([^_]+)_/g);
  if (italicParts.length > 1) {
    return italicParts.map((part, idx) => {
      if (idx % 2 === 1) {
        return React.createElement(
          "em",
          { key: `${keyPrefix}-i-${idx}`, className: "retroItalic" },
          part,
        );
      }
      return renderInlineFormatting(part, `${keyPrefix}-i${idx}`);
    });
  }

  // Yahoo Emoticons
  const parts: ReactNode[] = [];
  const words = segment.split(" ");
  words.forEach((word, wIdx) => {
    const found = DESKTOP_EMOTICONS.find(
      (emoticon: DesktopEmoticon) =>
        emoticon.code === word || emoticon.aliases.includes(word),
    );
    if (found) {
      parts.push(
        React.createElement(
          "span",
          { key: `${keyPrefix}-emo-${wIdx}`, className: "inlineEmoticon" },
          getDesktopSmileySvg(found.code, 18) ?? found.code,
        ),
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

function renderTextParagraphs(text: string, prefix: string): ReactNode {
  const lines = text.split("\n");
  return React.createElement(
    React.Fragment,
    { key: prefix },
    lines.map((line, lIdx) => {
      if (line.startsWith("> ")) {
        return React.createElement(
          "blockquote",
          { key: `${prefix}-q-${lIdx}`, className: "retroQuote" },
          renderInlineFormatting(line.slice(2), `${prefix}-ql-${lIdx}`),
        );
      }
      return React.createElement(
        "span",
        { key: `${prefix}-line-${lIdx}` },
        renderInlineFormatting(line, `${prefix}-l-${lIdx}`),
        lIdx < lines.length - 1 ? React.createElement("br", { key: `${prefix}-br-${lIdx}` }) : null,
      );
    }),
  );
}

export function renderWithYahooEmoticons(text: string): ReactNode[] {
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
      React.createElement(
        "pre",
        { key: `codeblock-${match.index}`, className: "retroCodeBlock" },
        React.createElement("div", { className: "codeBlockHeader" }, codeLang),
        React.createElement("code", null, codeContent),
      ),
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    blocks.push(renderTextParagraphs(text.slice(lastIndex), `blk-${lastIndex}`));
  }

  return blocks.length > 0 ? blocks : [text];
}
