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
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (left, right) => left.sequence - right.sequence,
  );
}

export function renderWithYahooEmoticons(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const words = text.split(" ");
  words.forEach((word, wIdx) => {
    const found = DESKTOP_EMOTICONS.find(
      (emoticon: DesktopEmoticon) =>
        emoticon.code === word || emoticon.aliases.includes(word),
    );
    if (found) {
      parts.push(
        React.createElement(
          "span",
          { key: `emo-${wIdx}`, className: "inlineEmoticon" },
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
