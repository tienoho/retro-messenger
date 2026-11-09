import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

// Base classic Yahoo yellow gradient face
function YahooFace({
  size = 18,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      {...props}
    >
      <defs>
        <radialGradient id="yhFaceGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fff275" />
          <stop offset="45%" stopColor="#fed633" />
          <stop offset="100%" stopColor="#e5a100" />
        </radialGradient>
        <radialGradient id="yhRedFaceGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff7777" />
          <stop offset="70%" stopColor="#ee2222" />
          <stop offset="100%" stopColor="#990000" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.5" fill="url(#yhFaceGrad)" stroke="#b37d00" strokeWidth="1" />
      {/* Specular highlight */}
      <ellipse cx="8.5" cy="6.5" rx="3.5" ry="1.8" fill="#ffffff" opacity="0.6" transform="rotate(-25 8.5 6.5)" />
      {children}
    </svg>
  );
}

// 1. Happy :)
export function SmileyHappy({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8.5" cy="10" r="1.5" fill="#221100" />
      <circle cx="15.5" cy="10" r="1.5" fill="#221100" />
      <path d="M7.5 13.5 C9 17 15 17 16.5 13.5" stroke="#221100" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 2. Sad :(
export function SmileySad({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8.5" cy="10" r="1.5" fill="#221100" />
      <circle cx="15.5" cy="10" r="1.5" fill="#221100" />
      <path d="M7.5 16 C9 13.5 15 13.5 16.5 16" stroke="#221100" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 3. Wink ;)
export function SmileyWink({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <path d="M6.5 10.5 C7.5 9 9.5 9 10.5 10.5" stroke="#221100" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="15.5" cy="10" r="1.5" fill="#221100" />
      <path d="M7.5 13.5 C9 17 15 17 16.5 13.5" stroke="#221100" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 4. Big Grin :D
export function SmileyGrin({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8.5" cy="9.5" r="1.5" fill="#221100" />
      <circle cx="15.5" cy="9.5" r="1.5" fill="#221100" />
      <path d="M6.5 13 Q12 13 17.5 13 C17 18 7 18 6.5 13 Z" fill="#ffffff" stroke="#221100" strokeWidth="1.3" />
      <line x1="6.5" y1="13" x2="17.5" y2="13" stroke="#221100" strokeWidth="1.2" />
    </YahooFace>
  );
}

// 5. Blushing :">
export function SmileyBlush({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8.5" cy="10" r="1.5" fill="#221100" />
      <circle cx="15.5" cy="10" r="1.5" fill="#221100" />
      {/* Pink blush cheeks */}
      <circle cx="6" cy="13.5" r="2.5" fill="#ff4d88" opacity="0.65" />
      <circle cx="18" cy="13.5" r="2.5" fill="#ff4d88" opacity="0.65" />
      <path d="M9 14.5 C10.5 16.5 13.5 16.5 15 14.5" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 6. Cool (Sunglasses) B-)
export function SmileyCool({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      {/* Sunglasses bridge */}
      <line x1="10" y1="9.5" x2="14" y2="9.5" stroke="#111111" strokeWidth="1.8" />
      {/* Left lens */}
      <path d="M5 8.5 H11 V11 C11 13 6 13 5 11 Z" fill="#111111" />
      <line x1="6" y1="9.5" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
      {/* Right lens */}
      <path d="M13 8.5 H19 V11 C19 13 14 13 13 11 Z" fill="#111111" />
      <line x1="14" y1="9.5" x2="16" y2="11.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
      {/* Smug smile */}
      <path d="M9 15 C11 16.5 14 16.5 16 14.5" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 7. Crying =((
export function SmileyCry({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8" cy="10" r="1.5" fill="#221100" />
      <circle cx="16" cy="10" r="1.5" fill="#221100" />
      {/* Blue tears */}
      <path d="M7 11.5 C7 14 8 16 8 17 C7 17 6 15 6 13 Z" fill="#00aaff" />
      <path d="M17 11.5 C17 14 16 16 16 17 C17 17 18 15 18 13 Z" fill="#00aaff" />
      <path d="M8 16 C10 13.5 14 13.5 16 16" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 8. Angry X(
export function SmileyAngry({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="12" cy="12" r="10.5" fill="#ff4444" stroke="#990000" strokeWidth="1" />
      {/* Angry eyebrows */}
      <line x1="6" y1="8" x2="11" y2="10.5" stroke="#220000" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="8" x2="13" y2="10.5" stroke="#220000" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8.5" cy="12" r="1.3" fill="#220000" />
      <circle cx="15.5" cy="12" r="1.3" fill="#220000" />
      <path d="M8 16.5 C10 14.5 14 14.5 16 16.5" stroke="#220000" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 9. Surprise :-O
export function SmileySurprise({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8" cy="9" r="1.6" fill="#221100" />
      <circle cx="16" cy="9" r="1.6" fill="#221100" />
      <ellipse cx="12" cy="15" rx="2.5" ry="3.5" fill="#221100" />
    </YahooFace>
  );
}

// 10. Tongue out :P
export function SmileyTongue({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8.5" cy="9.5" r="1.5" fill="#221100" />
      <circle cx="15.5" cy="9.5" r="1.5" fill="#221100" />
      <line x1="7.5" y1="13" x2="16.5" y2="13" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 13 V16 C10 17.5 13 17.5 13 16 V13" fill="#ff3366" stroke="#221100" strokeWidth="1" />
    </YahooFace>
  );
}

// 11. Kiss :-*
export function SmileyKiss({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8" cy="9.5" r="1.5" fill="#221100" />
      <circle cx="16" cy="9.5" r="1.5" fill="#221100" />
      {/* Puckered kiss lips */}
      <path d="M11 14 C12 13 12 13 13 14 C12 15 12 15 11 14" stroke="#cc0022" strokeWidth="2" strokeLinecap="round" fill="#ff3366" />
      <circle cx="6" cy="13" r="2" fill="#ff77aa" opacity="0.6" />
    </YahooFace>
  );
}

// 12. Laughing hysterically =))
export function SmileyLaugh({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      {/* Squinted closed eyes > < */}
      <path d="M6.5 8.5 L9.5 10.5 L6.5 12" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17.5 8.5 L14.5 10.5 L17.5 12" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Giant open mouth */}
      <path d="M6 13 Q12 13 18 13 C18 19 6 19 6 13 Z" fill="#cc0022" stroke="#221100" strokeWidth="1.2" />
      <path d="M8 13 Q12 13 16 13 C16 14.5 8 14.5 8 13 Z" fill="#ffffff" />
    </YahooFace>
  );
}

// 13. Angel O:-)
export function SmileyAngel({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      {/* Halo */}
      <ellipse cx="12" cy="3" rx="7" ry="2" stroke="#ffd700" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="13" r="9.5" fill="#fed633" stroke="#b37d00" strokeWidth="1" />
      <circle cx="9" cy="11.5" r="1.4" fill="#221100" />
      <circle cx="15" cy="11.5" r="1.4" fill="#221100" />
      <path d="M8.5 15 C10 17.5 14 17.5 15.5 15" stroke="#221100" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 14. Devil >:)
export function SmileyDevil({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      {/* Horns */}
      <path d="M5 7 L8 10 L4 11 Z" fill="#cc0000" stroke="#880000" strokeWidth="0.8" />
      <path d="M19 7 L16 10 L20 11 Z" fill="#cc0000" stroke="#880000" strokeWidth="0.8" />
      <circle cx="12" cy="13" r="9.5" fill="#e62200" stroke="#880000" strokeWidth="1" />
      <circle cx="9" cy="12" r="1.4" fill="#ffffff" />
      <circle cx="15" cy="12" r="1.4" fill="#ffffff" />
      <circle cx="9.3" cy="12" r="0.7" fill="#000000" />
      <circle cx="14.7" cy="12" r="0.7" fill="#000000" />
      {/* Evil grin */}
      <path d="M8 16 C10 18 14 18 16 16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 15. Nerd :-B
export function SmileyNerd({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8" cy="9.5" r="3.2" stroke="#111111" strokeWidth="1.4" fill="#ffffff" opacity="0.8" />
      <circle cx="16" cy="9.5" r="3.2" stroke="#111111" strokeWidth="1.4" fill="#ffffff" opacity="0.8" />
      <line x1="11.2" y1="9.5" x2="12.8" y2="9.5" stroke="#111111" strokeWidth="1.5" />
      <circle cx="8" cy="9.5" r="1.2" fill="#111111" />
      <circle cx="16" cy="9.5" r="1.2" fill="#111111" />
      {/* Buck teeth */}
      <rect x="10.5" y="14" width="3" height="3" fill="#ffffff" stroke="#111111" strokeWidth="0.8" />
      <line x1="12" y1="14" x2="12" y2="17" stroke="#111111" strokeWidth="0.8" />
    </YahooFace>
  );
}

// 16. Worried / Biting nails :-SS
export function SmileyWorried({ size = 18, ...props }: IconProps) {
  return (
    <YahooFace size={size} {...props}>
      <circle cx="8" cy="9.5" r="1.5" fill="#221100" />
      <circle cx="16" cy="9.5" r="1.5" fill="#221100" />
      {/* Blue sweat bead */}
      <path d="M18 5 C19 7 20 8 19 9 C18 9 17 8 18 5 Z" fill="#00bfff" />
      {/* Squiggly anxious mouth */}
      <path d="M8 15 Q10 13.5 12 15 Q14 16.5 16 15" stroke="#221100" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </YahooFace>
  );
}

// 17. Coffee (~~)
export function SmileyCoffee({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      {/* Steam */}
      <path d="M7 4 C8 6 6 7 7 9" stroke="#999999" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M11 3 C12 5 10 6 11 8" stroke="#999999" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Cup */}
      <path d="M4 9 H16 V16 C16 19 13 20 10 20 C7 20 4 19 4 16 Z" fill="#ffffff" stroke="#553311" strokeWidth="1.3" />
      {/* Handle */}
      <path d="M16 10 C19 10 19 15 16 15" stroke="#553311" strokeWidth="1.4" fill="none" />
      <line x1="2" y1="21" x2="18" y2="21" stroke="#553311" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 18. Tea ~O)
export function SmileyTea({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M4 10 H16 V15 C16 18 13 19 10 19 C7 19 4 18 4 15 Z" fill="#d9f2d9" stroke="#236623" strokeWidth="1.3" />
      <path d="M16 11 C18 11 18 14 16 14" stroke="#236623" strokeWidth="1.3" fill="none" />
      <ellipse cx="10" cy="20" rx="8" ry="1.5" fill="#ffffff" stroke="#236623" strokeWidth="1" />
    </svg>
  );
}

// 19. Rose @};-
export function SmileyRose({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      {/* Red flower bloom */}
      <circle cx="8" cy="8" r="5" fill="#e60026" stroke="#990014" strokeWidth="1" />
      <circle cx="9" cy="7" r="3" fill="#ff3355" />
      <circle cx="9.5" cy="6.5" r="1.5" fill="#ff7799" />
      {/* Green stem */}
      <path d="M8 13 Q10 17 18 20" stroke="#1f801f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Leaf */}
      <path d="M11 15 Q15 13 14 17 Z" fill="#2eb82e" stroke="#1f801f" strokeWidth="0.8" />
    </svg>
  );
}

// 20. Clover %%-
export function SmileyClover({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="8" cy="8" r="3.5" fill="#28a745" stroke="#145523" strokeWidth="0.8" />
      <circle cx="14" cy="8" r="3.5" fill="#28a745" stroke="#145523" strokeWidth="0.8" />
      <circle cx="8" cy="14" r="3.5" fill="#28a745" stroke="#145523" strokeWidth="0.8" />
      <circle cx="14" cy="14" r="3.5" fill="#28a745" stroke="#145523" strokeWidth="0.8" />
      <path d="M11 13 Q11 19 16 21" stroke="#145523" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 21. Lightbulb / Idea *-:)
export function SmileyIdea({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path d="M8 9 C8 5 16 5 16 9 C16 11 14 12 14 14 H10 C10 12 8 11 8 9 Z" fill="#ffe033" stroke="#cc9900" strokeWidth="1.2" />
      <rect x="10" y="14" width="4" height="2" fill="#888888" stroke="#555" strokeWidth="0.6" />
      <rect x="11" y="16" width="2" height="1.5" fill="#555555" />
      {/* Light rays */}
      <line x1="12" y1="2" x2="12" y2="4" stroke="#ffb700" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="5" x2="6.5" y2="6.5" stroke="#ffb700" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="5" x2="17.5" y2="6.5" stroke="#ffb700" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 22. BUZZ Lightning Bolt (BUZZ)
export function SmileyBuzz({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <path
        d="M13 2 L4 13 H12 L10 22 L20 10 H12 L13 2 Z"
        fill="#ffe600"
        stroke="#cc0000"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 23. Skull 8-X
export function SmileySkull({ size = 18, ...props }: IconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }} {...props}>
      <circle cx="12" cy="10" r="7" fill="#ffffff" stroke="#333333" strokeWidth="1.3" />
      <rect x="9" y="15" width="6" height="4" fill="#ffffff" stroke="#333333" strokeWidth="1" />
      <circle cx="9.5" cy="10" r="2" fill="#222222" />
      <circle cx="14.5" cy="10" r="2" fill="#222222" />
      <line x1="11" y1="16" x2="11" y2="18" stroke="#333" strokeWidth="0.8" />
      <line x1="13" y1="16" x2="13" y2="18" stroke="#333" strokeWidth="0.8" />
    </svg>
  );
}

// Helper to look up SVG component by Yahoo code
export function getSmileySvg(code: string, size = 18) {
  switch (code) {
    case ":)":
    case ":-)":
      return <SmileyHappy size={size} />;
    case ":(":
    case ":-(":
      return <SmileySad size={size} />;
    case ";)":
    case ";-)":
      return <SmileyWink size={size} />;
    case ":D":
    case ":-D":
    case ":d":
      return <SmileyGrin size={size} />;
    case ':">':
      return <SmileyBlush size={size} />;
    case "B-)":
    case "b-)":
      return <SmileyCool size={size} />;
    case "=((":
    case ":'(":
      return <SmileyCry size={size} />;
    case "X(":
    case "x(":
      return <SmileyAngry size={size} />;
    case ":-O":
    case ":O":
    case ":o":
      return <SmileySurprise size={size} />;
    case ":P":
    case ":-P":
    case ":p":
    case ":-p":
      return <SmileyTongue size={size} />;
    case ":-*":
    case ":*":
      return <SmileyKiss size={size} />;
    case "=))":
      return <SmileyLaugh size={size} />;
    case "O:-)":
    case "o:-)":
      return <SmileyAngel size={size} />;
    case ">:)":
    case ">:-)":
      return <SmileyDevil size={size} />;
    case ":-B":
    case ":-b":
      return <SmileyNerd size={size} />;
    case ":-SS":
    case ":-ss":
    case ":SS":
    case ":ss":
      return <SmileyWorried size={size} />;
    case "(~~)":
      return <SmileyCoffee size={size} />;
    case "~O)":
      return <SmileyTea size={size} />;
    case "@};-":
      return <SmileyRose size={size} />;
    case "%%-":
      return <SmileyClover size={size} />;
    case "*-:)":
      return <SmileyIdea size={size} />;
    case "8-X":
    case "8-x":
      return <SmileySkull size={size} />;
    case "(BUZZ)":
    case "buzz":
    case "BUZZ!":
    case "BUZZ!!!":
      return <SmileyBuzz size={size} />;
    default:
      return null;
  }
}

