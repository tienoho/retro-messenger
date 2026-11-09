import type { SVGProps, ReactNode } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

// 1. BUZZ Lightning Bolt
export function IconBuzz({ size = 14, ...props }: IconProps) {
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

// 2. Paperclip Attachment
export function IconPaperclip({ size = 14, ...props }: IconProps) {
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

// 3. Pencil Writing
export function IconPencil({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M12.5 1.5 L14.5 3.5 L5 13 L2 14 L3 11 L12.5 1.5 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="0.9" />
      <path d="M2 14 L3 11 L5 13 Z" fill="#44403c" />
      <path d="M11.5 2.5 L13.5 4.5" stroke="#ffffff" strokeWidth="0.8" />
    </svg>
  );
}

// 4. Glossy Yahoo Smiley: Happy / Smiling (:) :-)
export function SmileyHappy({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtSmileyGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtSmileyGrad)" stroke="#c48200" strokeWidth="1" />
      <ellipse cx="8.5" cy="9.5" rx="1.5" ry="2.2" fill="#3a2500" />
      <ellipse cx="15.5" cy="9.5" rx="1.5" ry="2.2" fill="#3a2500" />
      <circle cx="9" cy="8.5" r="0.6" fill="#ffffff" />
      <circle cx="16" cy="8.5" r="0.6" fill="#ffffff" />
      <path d="M7 14 C8 17.5 16 17.5 17 14" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M4 8 C6 4 10 3 14 3.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.6" fill="none" />
    </svg>
  );
}

// 5. Glossy Yahoo Smiley: Sad (:( :-(
export function SmileySad({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtSadGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtSadGrad)" stroke="#c48200" strokeWidth="1" />
      <ellipse cx="8.5" cy="10" rx="1.5" ry="2" fill="#3a2500" />
      <ellipse cx="15.5" cy="10" rx="1.5" ry="2" fill="#3a2500" />
      <circle cx="9" cy="9" r="0.5" fill="#ffffff" />
      <circle cx="16" cy="9" r="0.5" fill="#ffffff" />
      <path d="M7.5 17 C8.5 14.5 15.5 14.5 16.5 17" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 6. Glossy Yahoo Smiley: Winking (;) ;-)
export function SmileyWink({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtWinkGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtWinkGrad)" stroke="#c48200" strokeWidth="1" />
      <path d="M6.5 9.5 C7.5 8 9.5 8 10.5 9.5" stroke="#3a2500" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="15.5" cy="9.5" rx="1.5" ry="2.2" fill="#3a2500" />
      <circle cx="16" cy="8.5" r="0.6" fill="#ffffff" />
      <path d="M7 14 C8 17.5 16 17.5 17 14" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 7. Glossy Yahoo Smiley: Big Grin (:D :-D)
export function SmileyGrin({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtGrinGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtGrinGrad)" stroke="#c48200" strokeWidth="1" />
      <ellipse cx="8.5" cy="8.5" rx="1.5" ry="2" fill="#3a2500" />
      <ellipse cx="15.5" cy="8.5" rx="1.5" ry="2" fill="#3a2500" />
      <path d="M6 13 C6 18.5 18 18.5 18 13 Z" fill="#ffffff" stroke="#754300" strokeWidth="1.5" />
      <line x1="6" y1="13" x2="18" y2="13" stroke="#754300" strokeWidth="1.5" />
    </svg>
  );
}

// 8. Glossy Yahoo Smiley: Cool Sunglasses (B-)
export function SmileyCool({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtCoolGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtCoolGrad)" stroke="#c48200" strokeWidth="1" />
      <path d="M4 9 Q8 8 11.5 9 Q12.5 9 13.5 9 Q16 8 20 9" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M5 9 Q6 14 11 13 Q11.5 9 11 9 Z" fill="#1f2937" stroke="#111827" strokeWidth="0.8" />
      <path d="M13 9 Q12.5 13 17 13 Q18.5 12 19 9 Z" fill="#1f2937" stroke="#111827" strokeWidth="0.8" />
      <line x1="6" y1="10" x2="8" y2="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
      <line x1="14" y1="10" x2="16" y2="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
      <path d="M8.5 15.5 Q12 18 15.5 15.5" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 9. Glossy Yahoo Smiley: Crying (=(()
export function SmileyCry({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtCryGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtCryGrad)" stroke="#c48200" strokeWidth="1" />
      <path d="M6 9 C7 7.5 9 7.5 10 9" stroke="#3a2500" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M14 9 C15 7.5 17 7.5 18 9" stroke="#3a2500" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M7 13 C7 17 9 20 8 21" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M17 13 C17 17 15 20 16 21" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M8 17 C9.5 15 14.5 15 16 17" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 10. Glossy Yahoo Smiley: Tongue Out (:P :-P)
export function SmileyTongue({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <defs>
        <radialGradient id="dtTongueGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="60%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#dtTongueGrad)" stroke="#c48200" strokeWidth="1" />
      <ellipse cx="8.5" cy="9" rx="1.5" ry="2.2" fill="#3a2500" />
      <ellipse cx="15.5" cy="9" rx="1.5" ry="2.2" fill="#3a2500" />
      <circle cx="9" cy="8" r="0.6" fill="#ffffff" />
      <circle cx="16" cy="8" r="0.6" fill="#ffffff" />
      <line x1="7" y1="13.5" x2="17" y2="13.5" stroke="#754300" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 13.5 V17 C10 18.5 14 18.5 14 17 V13.5" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
      <line x1="12" y1="14" x2="12" y2="16.5" stroke="#be123c" strokeWidth="0.8" />
    </svg>
  );
}

// Dynamic emoticon resolver by code
export function getDesktopSmileySvg(code: string, size = 18): ReactNode | null {
  switch (code) {
    case ":)":
    case ":-)":
      return <SmileyHappy size={size} />;
    case ":(":
    case ":-(":
    case ":-<":
      return <SmileySad size={size} />;
    case ";)":
    case ";-)":
      return <SmileyWink size={size} />;
    case ":D":
    case ":-D":
    case ":d":
    case "=))":
      return <SmileyGrin size={size} />;
    case "B-)":
    case "b-)":
      return <SmileyCool size={size} />;
    case "=((":
    case ":'(":
      return <SmileyCry size={size} />;
    case ":P":
    case ":-P":
    case ":p":
      return <SmileyTongue size={size} />;
    case "(BUZZ)":
    case "buzz":
    case "BUZZ!":
      return <IconBuzz size={size} />;
    default:
      return <SmileyHappy size={size} />;
  }
}

// 12. Phone Call
export function IconPhone({ size = 14, ...props }: IconProps) {
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

// 13. Video Webcam
export function IconVideo({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="1.5" y="3.5" width="9.5" height="9" rx="1.5" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1" />
      <path d="M11 6 L14.5 4 V12 L11 10 V6 Z" fill="#7c3aed" stroke="#5b21b6" strokeWidth="0.8" />
      <circle cx="6.2" cy="8" r="2" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

// 14. Microphone
export function IconMicrophone({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" fill="#2563eb" stroke="#1d4ed8" strokeWidth="0.8" />
      <path d="M3 6.5 C3 10 5.2 12.5 8 12.5 C10.8 12.5 13 10 13 6.5" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <line x1="8" y1="12.5" x2="8" y2="15" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.5" y1="15" x2="10.5" y2="15" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// 15. Microphone Muted
export function IconMicrophoneMuted({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <rect x="5.5" y="1.5" width="5" height="8.5" rx="2.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
      <line x1="2" y1="2" x2="14" y2="14" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 16. Check
export function IconCheck({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M3 8.5 L6.5 12 L13 4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// 17. Cross
export function IconCross({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <line x1="3.5" y1="3.5" x2="12.5" y2="12.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12.5" y1="3.5" x2="3.5" y2="12.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 18. Yahoo Logo Icon
export function YahooLogoIcon({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7.5" fill="#7b0099" stroke="#520066" strokeWidth="0.8" />
      <text x="8" y="11.5" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="Trebuchet MS, Arial" textAnchor="middle">
        Y!
      </text>
    </svg>
  );
}

// 19. Speaker / Sound On
export function IconSpeaker({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <polygon points="2,6 5,6 8,3 8,13 5,10 2,10" fill="#ffffff" stroke="#360f4a" strokeWidth="1" />
      <path d="M10.5 5 C11.5 6 12 7 12 8 C12 9 11.5 10 10.5 11" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M12.5 3 C14 4.5 14.5 6.2 14.5 8 C14.5 9.8 14 11.5 12.5 13" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 20. Speaker Muted
export function IconSpeakerMuted({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <polygon points="2,6 5,6 8,3 8,13 5,10 2,10" fill="#ffffff" stroke="#360f4a" strokeWidth="1" />
      <line x1="10" y1="6" x2="14" y2="10" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="6" x2="10" y2="10" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 21. Audibles Megaphone
export function IconAudibles({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M2 6 H4 L9 2 V14 L4 10 H2 C1.4 10 1 9.6 1 9 V7 C1 6.4 1.4 6 2 6 Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1" />
      <path d="M11.5 5 C12.5 6 13 7 13 8 C13 9 12.5 10 11.5 11" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M13.5 3 C15 4.5 15.5 6.2 15.5 8 C15.5 9.8 15 11.5 13.5 13" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 22. Color Palette
export function IconPalette({ size = 14, ...props }: IconProps) {
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

// 23. Status Dots
export function StatusDotOnline({ size = 10, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="5" cy="5" r="4.5" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
    </svg>
  );
}

export function StatusDotAway({ size = 10, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="5" cy="5" r="4.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
    </svg>
  );
}

export function StatusDotBusy({ size = 10, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="5" cy="5" r="4.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
      <line x1="2.5" y1="5" x2="7.5" y2="5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function StatusDotInvisible({ size = 10, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 10 10" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="5" cy="5" r="4.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
    </svg>
  );
}

// 24. Action Icons
export function IconAdd({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
      <line x1="8" y1="4.5" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconInfo({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="7" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <line x1="8" y1="7" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="4.5" r="1" fill="#ffffff" />
    </svg>
  );
}

export function IconDoor({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M2 14 H14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 14 V3 C4 2.4 4.4 2 5 2 H11 C11.6 2 12 2.4 12 3 V14" fill="#94a3b8" stroke="#475569" strokeWidth="1.2" />
      <circle cx="10" cy="8.5" r="1" fill="#f59e0b" />
    </svg>
  );
}

// 25. Game Controller / Yahoo! Games
export function IconGame({ size = 14, ...props }: IconProps) {
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

// 26. Theme Brush
export function IconTheme({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M2 13 C2 11 3 10 5 10 H11 V14 H2 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <path d="M5 10 V4 C5 3 6 2 7 2 H9 C10 2 11 3 11 4 V10" fill="#9333ea" stroke="#6b21a8" strokeWidth="0.8" />
      <circle cx="8" cy="12" r="1" fill="#ffffff" />
    </svg>
  );
}

// 27. Chat Speech Bubble
export function IconChat({ size = 14, ...props }: IconProps) {
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

// 28. Block Icon
export function IconBlock({ size = 14, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="6" stroke="#cc0000" strokeWidth="1.5" />
      <line x1="3.8" y1="12.2" x2="12.2" y2="3.8" stroke="#cc0000" strokeWidth="1.5" />
    </svg>
  );
}



