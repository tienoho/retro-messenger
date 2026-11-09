import React, { type ReactNode, useState } from "react";

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
        borderRadius: 4,
        padding: "6px 10px",
        color: mine ? "#0000cc" : "#cc0000",
        background: mine ? "#f4f6fc" : "#fff8f8",
        border: `1px solid ${mine ? "#b0c4de" : "#e6b8b8"}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {children}
    </div>
  );
}

export interface RetroWindowTitleBarProps {
  title: string;
  icon?: string;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}

export function RetroWindowTitleBar({
  title,
  icon = "R!",
  onMinimize,
  onMaximize,
  onClose,
}: RetroWindowTitleBarProps) {
  return (
    <div
      style={{
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        background: "linear-gradient(180deg, #6c238f 0%, #521971 45%, #42125d 50%, #5b1f7c 100%)",
        borderBottom: "1px solid #360f4a",
        color: "#ffffff",
        userSelect: "none",
        fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "bold", fontSize: 12 }}>
        <span
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 18,
            height: 18,
            borderRadius: 3,
            background: "#fed633",
            color: "#471a68",
            fontSize: 11,
            fontWeight: 900,
            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {icon}
        </span>
        <span style={{ textShadow: "1px 1px 1px #000000" }}>{title}</span>
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        <button
          type="button"
          onClick={onMinimize}
          title="Thu nhỏ"
          style={{
            width: 20,
            height: 18,
            padding: 0,
            border: "1px solid #360f4a",
            borderRadius: 2,
            background: "linear-gradient(180deg, #ffffff 0%, #c4b5d6 100%)",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 10,
            lineHeight: "14px",
          }}
        >
          _
        </button>
        <button
          type="button"
          onClick={onMaximize}
          title="Phóng to"
          style={{
            width: 20,
            height: 18,
            padding: 0,
            border: "1px solid #360f4a",
            borderRadius: 2,
            background: "linear-gradient(180deg, #ffffff 0%, #c4b5d6 100%)",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 10,
            lineHeight: "14px",
          }}
        >
          □
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Đóng"
          style={{
            width: 20,
            height: 18,
            padding: 0,
            border: "1px solid #661111",
            borderRadius: 2,
            background: "linear-gradient(180deg, #ff7777 0%, #cc2222 100%)",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 10,
            lineHeight: "14px",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function RetroMenuBar({
  items = ["Messenger", "Contacts", "Actions", "Help"],
}: {
  items?: string[];
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "3px 10px",
        background: "#ede7f6",
        borderBottom: "1px solid #d0c4df",
        fontSize: 11,
        fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
        userSelect: "none",
      }}
    >
      {items.map((item) => (
        <span
          key={item}
          style={{
            cursor: "pointer",
            color: "#331144",
            padding: "2px 4px",
            borderRadius: 2,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function RetroStatusBadge({
  status,
  size = 14,
}: {
  status: string;
  size?: number;
}) {
  const s = `${size}px`;
  switch (status.toLowerCase()) {
    case "online":
      return (
        <span title="Đang trực tuyến (Online)" style={{ display: "inline-flex", alignItems: "center" }}>
          <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" fill="#22c55e" stroke="#166534" strokeWidth="1" />
            <ellipse cx="6" cy="5" rx="2" ry="1" fill="#ffffff" opacity="0.75" />
          </svg>
        </span>
      );
    case "away":
      return (
        <span title="Vắng mặt (Away)" style={{ display: "inline-flex", alignItems: "center" }}>
          <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" fill="#eab308" stroke="#854d0e" strokeWidth="1" />
            <polyline points="8,4 8,8 11,8" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          </svg>
        </span>
      );
    case "busy":
      return (
        <span title="Bận rộn (Busy)" style={{ display: "inline-flex", alignItems: "center" }}>
          <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <rect x="4" y="6.8" width="8" height="2.4" rx="0.5" fill="#ffffff" />
          </svg>
        </span>
      );
    default:
      return (
        <span title="Ngoại tuyến (Offline)" style={{ display: "inline-flex", alignItems: "center" }}>
          <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" fill="#94a3b8" stroke="#334155" strokeWidth="1" />
            <ellipse cx="6" cy="5" rx="2" ry="1" fill="#ffffff" opacity="0.6" />
          </svg>
        </span>
      );
  }
}
