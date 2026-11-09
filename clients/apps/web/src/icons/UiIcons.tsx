import type { SVGProps } from "react";

export type UiIconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

// 1. Chat Speech Bubble
export function IconChat({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M2 3 C2 1.9 2.9 1 4 1 H12 C13.1 1 14 1.9 14 3 V9 C14 10.1 13.1 11 12 11 H5 L2 14 V3 Z"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="1"
      />
      <line x1="4.5" y1="4.5" x2="11.5" y2="4.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 2. Contacts / Buddies
export function IconContacts({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      {/* Back figure */}
      <circle cx="11" cy="4.5" r="2" fill="#9333ea" />
      <path d="M7.5 13 C7.5 10.5 9 9.5 11 9.5 C13 9.5 14.5 10.5 14.5 13" fill="#9333ea" />
      {/* Front figure */}
      <circle cx="5.5" cy="5" r="2.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M1.5 14 C1.5 11 3.5 10 5.5 10 C7.5 10 9.5 11 9.5 14" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
}

// 3. Rooms / Globe
export function IconRooms({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="6.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <ellipse cx="8" cy="8" rx="3" ry="6.5" stroke="#ffffff" strokeWidth="0.9" fill="none" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" stroke="#ffffff" strokeWidth="0.9" />
      <line x1="3" y1="4.5" x2="13" y2="4.5" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
      <line x1="3" y1="11.5" x2="13" y2="11.5" stroke="#ffffff" strokeWidth="0.7" opacity="0.8" />
    </svg>
  );
}

// 4. BUZZ Lightning Bolt
export function IconBuzz({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M9 1 L2 9 H8 L7 15 L14 7 H8 L9 1 Z"
        fill="#ffe600"
        stroke="#cc0000"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 5. Phone Call
export function IconPhone({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M3 2 C2.5 2 2 2.5 2 3 C2 9.5 6.5 14 13 14 C13.5 14 14 13.5 14 13 V10.5 C14 10 13.5 9.7 13 9.5 L10.8 8.8 C10.4 8.6 9.9 8.8 9.7 9.1 L8.8 10 C6.8 9 5 7.2 4 5.2 L4.9 4.3 C5.2 4.1 5.4 3.6 5.2 3.2 L4.5 1 C4.3 0.5 4 0.2 3.5 0.2 H3 Z"
        fill="#16a34a"
        stroke="#14532d"
        strokeWidth="0.8"
      />
    </svg>
  );
}

// 6. Video Webcam
export function IconVideo({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="1.5" y="3.5" width="9.5" height="9" rx="1.5" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1" />
      <path d="M11 6 L14.5 4 V12 L11 10 V6 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="0.8" />
      <circle cx="6.2" cy="8" r="2" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

// 7. Pencil Writing
export function IconPencil({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M12.5 1.5 L14.5 3.5 L5 13 L2 14 L3 11 L12.5 1.5 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.9" />
      <path d="M2 14 L3 11 L5 13 Z" fill="#44403c" />
      <path d="M11.5 2.5 L13.5 4.5" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
}

// 8. Music Note
export function IconMusic({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="4.5" cy="11.5" r="2.5" fill="#6c238f" />
      <circle cx="11.5" cy="9.5" r="2.5" fill="#6c238f" />
      <path d="M6.5 11.5 V3.5 L13.5 1.5 V9.5" stroke="#6c238f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <polygon points="6.5,3.5 13.5,1.5 13.5,4 6.5,6" fill="#6c238f" />
    </svg>
  );
}

// 9. Notification Bell
export function IconBell({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M8 2 C5.8 2 4.5 3.8 4.5 6 V9 L3 11 H13 L11.5 9 V6 C11.5 3.8 10.2 2 8 2 Z" fill="#eab308" stroke="#a16207" strokeWidth="1" />
      <circle cx="8" cy="13" r="1.5" fill="#a16207" />
    </svg>
  );
}

// 10. Block Contact
export function IconBlock({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="6" stroke="#dc2626" strokeWidth="1.8" fill="none" />
      <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 11. Speaker / Sound On
export function IconSpeaker({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <polygon points="2,6 5,6 8,3 8,13 5,10 2,10" fill="#ffffff" stroke="#360f4a" strokeWidth="1" />
      <path d="M10.5 5 C11.5 6 12 7 12 8 C12 9 11.5 10 10.5 11" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M12.5 3 C14 4.5 14.5 6.2 14.5 8 C14.5 9.8 14 11.5 12.5 13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 12. Speaker Muted
export function IconSpeakerMuted({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <polygon points="2,6 5,6 8,3 8,13 5,10 2,10" fill="#ffffff" stroke="#360f4a" strokeWidth="1" />
      <line x1="10" y1="6" x2="14" y2="10" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="6" x2="10" y2="10" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 13. Audibles Megaphone
export function IconAudibles({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M2 6 H4 L9 2 V14 L4 10 H2 C1.4 10 1 9.6 1 9 V7 C1 6.4 1.4 6 2 6 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
      <path d="M11.5 5 C12.5 6 13 7 13 8 C13 9 12.5 10 11.5 11" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M13.5 3 C15 4.5 15.5 6.2 15.5 8 C15.5 9.8 15 11.5 13.5 13" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 14. IMVironment Palette
export function IconPalette({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M8 1 C3.6 1 0 4.1 0 8 C0 10.5 1.5 12.5 3.8 13.5 C4.4 13.8 4.7 13.3 4.7 12.8 C4.7 12.3 4.5 11.8 4.8 11.3 C5.1 10.7 5.7 10.5 6.3 10.5 H7.5 C11.9 10.5 15.5 7.4 15.5 3.5 C15.5 2.1 12.2 1 8 1 Z"
        fill="#fef08a"
        stroke="#ca8a04"
        strokeWidth="0.8"
      />
      <circle cx="4" cy="5" r="1.2" fill="#ef4444" />
      <circle cx="7.5" cy="3.5" r="1.2" fill="#3b82f6" />
      <circle cx="11" cy="5" r="1.2" fill="#10b981" />
      <circle cx="12" cy="8" r="1.2" fill="#a855f7" />
    </svg>
  );
}

// 14b. Idea Lightbulb
export function IconIdea({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M8 2 C5.8 2 4 3.8 4 6 C4 7.5 5 8.7 5.7 9.7 C6 10.2 6.2 10.7 6.2 11.2 H9.8 C9.8 10.7 10 10.2 10.3 9.7 C11 8.7 12 7.5 12 6 C12 3.8 10.2 2 8 2 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
      <path d="M6.5 12 H9.5 M7 13.5 H9" stroke="#71717a" strokeWidth="1" strokeLinecap="round" />
      <circle cx="7" cy="5" r="0.8" fill="#ffffff" />
    </svg>
  );
}

// 14c. User Single
export function IconUser({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="5" r="3.2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
      <path d="M2.5 14 C2.5 11 5 9.5 8 9.5 C11 9.5 13.5 11 13.5 14" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
      <circle cx="7" cy="4" r="0.9" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

// 14d. Add / Plus
export function IconAdd({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="6.5" fill="#22c55e" stroke="#16a34a" strokeWidth="0.8" />
      <line x1="8" y1="4.5" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 14e. Door / Exit
export function IconDoor({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M3 14 V2 C3 1.4 3.6 1 4.2 1.2 L12.5 2.8 C13 2.9 13.4 3.4 13.4 4 V13 C13.4 13.6 13 14 12.4 14 H3 Z" fill="#b45309" stroke="#78350f" strokeWidth="0.9" />
      <circle cx="11" cy="8" r="1" fill="#fef08a" />
      <line x1="2" y1="14" x2="14" y2="14" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 14f. Info Circle
export function IconInfo({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="6.5" fill="#0284c7" stroke="#0369a1" strokeWidth="0.9" />
      <circle cx="8" cy="5" r="1" fill="#ffffff" />
      <line x1="8" y1="7" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 14g. Paperclip Attachment
export function IconPaperclip({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M13.5 6.5 L7.5 12.5 C6.1 13.9 3.9 13.9 2.5 12.5 C1.1 11.1 1.1 8.9 2.5 7.5 L8.5 1.5 C9.5 0.5 11.1 0.5 12.1 1.5 C13.1 2.5 13.1 4.1 12.1 5.1 L6.5 10.7 C5.9 11.3 5 11.3 4.4 10.7 C3.8 10.1 3.8 9.2 4.4 8.6 L9.5 3.5"
        stroke="#475569"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// 14h. File Document
export function IconFile({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M3 1 C2.4 1 2 1.4 2 2 V14 C2 14.6 2.4 15 3 15 H13 C13.6 15 14 14.6 14 14 V5 L10 1 H3 Z" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
      <path d="M10 1 V5 H14" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
      <line x1="4.5" y1="7.5" x2="11.5" y2="7.5" stroke="#94a3b8" strokeWidth="1" />
      <line x1="4.5" y1="10.5" x2="11.5" y2="10.5" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  );
}

// 14i. Microphone
export function IconMicrophone({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
      <path d="M3 6.5 C3 9.5 5.2 11.5 8 11.5 C10.8 11.5 13 9.5 13 6.5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <line x1="8" y1="11.5" x2="8" y2="14.5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="14.5" x2="11" y2="14.5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 14j. Microphone Muted
export function IconMicrophoneMuted({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
      <path d="M3 6.5 C3 9.5 5.2 11.5 8 11.5 C10.8 11.5 13 9.5 13 6.5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <line x1="8" y1="11.5" x2="8" y2="14.5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="14.5" x2="11" y2="14.5" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2" y1="2" x2="14" y2="14" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 14k. Checkmark
export function IconCheck({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7" fill="#22c55e" stroke="#16a34a" strokeWidth="0.8" />
      <polyline points="4.5,8 7,10.5 11.5,5.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// 14l. Cross / Decline
export function IconCross({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
      <line x1="5" y1="5" x2="11" y2="11" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="11" y1="5" x2="5" y2="11" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 15. Status Dots
export function StatusDotOnline({ size = 12, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dotOnlineGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#dotOnlineGrad)" stroke="#166534" strokeWidth="1" />
      <ellipse cx="6" cy="5" rx="2" ry="1" fill="#ffffff" opacity="0.75" />
    </svg>
  );
}

export function StatusDotBusy({ size = 12, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dotBusyGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#dotBusyGrad)" stroke="#991b1b" strokeWidth="1" />
      <rect x="4" y="6.8" width="8" height="2.4" rx="0.5" fill="#ffffff" />
    </svg>
  );
}

export function StatusDotAway({ size = 12, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dotAwayGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#dotAwayGrad)" stroke="#854d0e" strokeWidth="1" />
      <polyline points="8,4 8,8 11,8" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function StatusDotInvisible({ size = 12, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dotInvisGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#dotInvisGrad)" stroke="#334155" strokeWidth="1" />
      <ellipse cx="6" cy="5" rx="2" ry="1" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

// 16. Yahoo! Brand "Y!" Icon
export function YahooLogoIcon({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7.5" fill="#5b1e84" stroke="#ffd700" strokeWidth="1" />
      <path d="M4.5 4.5 L7.2 8.5 V12 H8.8 V8.5 L11.5 4.5 H9.8 L8 7.3 L6.2 4.5 H4.5 Z" fill="#ffd700" />
      <circle cx="12.2" cy="11.5" r="0.8" fill="#ffd700" />
    </svg>
  );
}

export const StatusDotAvailable = StatusDotOnline;

// 17. Game Controller / Yahoo! Games
export function IconGame({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M3 4 C2 4 1 5 1 7 L2 12 C2.3 13.5 4 13.5 5 12 L6.5 10 H9.5 L11 12 C12 13.5 13.7 13.5 14 12 L15 7 C15 5 14 4 13 4 H3 Z"
        fill="#7c3aed"
        stroke="#5b21b6"
        strokeWidth="1"
      />
      {/* D-pad */}
      <line x1="4.5" y1="6.5" x2="4.5" y2="9.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3" y1="8" x2="6" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      {/* Action buttons */}
      <circle cx="11.5" cy="7" r="0.8" fill="#fed633" />
      <circle cx="13" cy="8.5" r="0.8" fill="#ef4444" />
      <circle cx="10" cy="8.5" r="0.8" fill="#22c55e" />
      <circle cx="11.5" cy="10" r="0.8" fill="#3b82f6" />
    </svg>
  );
}

// 18. Theme Brush
export function IconTheme({ size = 14, ...props }: UiIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M2 13 C2 11 3 10 5 10 H11 V14 H2 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <path d="M5 10 V4 C5 3 6 2 7 2 H9 C10 2 11 3 11 4 V10" fill="#9333ea" stroke="#6b21a8" strokeWidth="0.8" />
      <circle cx="8" cy="12" r="1" fill="#ffffff" />
    </svg>
  );
}

// Helper to render status dot by string
export function renderStatusIcon(status: string, size = 12) {
  switch (status.toLowerCase()) {
    case "online":
    case "available":
      return <StatusDotOnline size={size} />;
    case "busy":
      return <StatusDotBusy size={size} />;
    case "away":
    case "idle":
      return <StatusDotAway size={size} />;
    case "invisible":
    case "offline":
    default:
      return <StatusDotInvisible size={size} />;
  }
}
