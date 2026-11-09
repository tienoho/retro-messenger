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

