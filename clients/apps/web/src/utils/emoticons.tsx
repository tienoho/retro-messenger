import { type ReactNode } from "react";
import { YAHOO_EMOTICONS } from "@retro/design-tokens";
import { getSmileySvg } from "../icons/YahooSmileys";

export function renderWithYahooEmoticons(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const words = text.split(" ");
  words.forEach((word, wIdx) => {
    const found = YAHOO_EMOTICONS.find(
      (e) => e.code === word || e.aliases.includes(word),
    );
    if (found) {
      const svg = getSmileySvg(found.code, 18);
      parts.push(
        <span
          key={`emo-${wIdx}`}
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
