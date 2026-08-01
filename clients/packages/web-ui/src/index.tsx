import type { ReactNode } from "react";

export interface MessageBubbleProps {
  mine?: boolean;
  children: ReactNode;
}

export function MessageBubble({
  mine = false,
  children,
}: MessageBubbleProps) {
  return (
    <div
      data-mine={mine ? "true" : "false"}
      style={{
        maxWidth: "72%",
        borderRadius: 16,
        padding: "10px 14px",
        color: mine ? "white" : "#202124",
        background: mine ? "#6c3fd1" : "white",
      }}
    >
      {children}
    </div>
  );
}
