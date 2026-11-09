export const colors = {
  primary: "#5b1e84",
  primaryDark: "#3d115a",
  primaryLight: "#782ea7",
  accent: "#fed633",
  accentGold: "#ffb700",
  online: "#28a745",
  away: "#f59e0b",
  busy: "#dc3545",
  offline: "#8a8d91",
  danger: "#dc3545",
  background: "#ede7f6",
  surface: "#ffffff",
  text: "#202124",
  muted: "#69707d",
  windowChrome: "#ede7f6",
  windowBorder: "#4a1563",
  panelBorder: "#7f9db9",
  myMessageText: "#0000cc",
  peerMessageText: "#cc0000",
  systemText: "#666666",
  buzzYellow: "#ffe600",
  buzzText: "#cc0000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const fonts = {
  family: 'Tahoma, "Segoe UI", Arial, sans-serif',
  sizeXs: 10,
  sizeSm: 11,
  sizeBase: 12,
  sizeMd: 13,
  sizeLg: 15,
  sizeXl: 18,
} as const;

export interface YahooEmoticonDefinition {
  code: string;
  name: string;
  symbol: string;
  aliases: string[];
}

export const YAHOO_EMOTICONS: YahooEmoticonDefinition[] = [
  { code: ":)", name: "Cười mỉm", symbol: ":)", aliases: [":-)"] },
  { code: ":(", name: "Buồn bã", symbol: ":(", aliases: [":-("] },
  { code: ";)", name: "Nháy mắt", symbol: ";)", aliases: [";-)"] },
  { code: ":D", name: "Cười toe toét", symbol: ":D", aliases: [":-D", ":d"] },
  { code: ";;)", name: "E thẹn", symbol: ";;)", aliases: [] },
  { code: ">:D<", name: "Ôm một cái", symbol: ">:D<", aliases: [] },
  { code: ":-/", name: "Phân vân", symbol: ":-/", aliases: [":/"] },
  { code: ":x", name: "Bí mật tình yêu", symbol: ":x", aliases: [":X", ":-x", ":-X"] },
  { code: ':">', name: "Ngại ngùng đỏ mặt", symbol: ':">', aliases: [] },
  { code: ":P", name: "Lè lưỡi trêu chọc", symbol: ":P", aliases: [":-P", ":p", ":-p"] },
  { code: ":-*", name: "Hôn gió", symbol: ":-*", aliases: [":*"] },
  { code: "=((", name: "Khóc nức nở", symbol: "=((", aliases: [":'(", ":-("] },
  { code: ":-O", name: "Ngạc nhiên há hốc", symbol: ":-O", aliases: [":O", ":o", ":-o"] },
  { code: "X(", name: "Giận tím người", symbol: "X(", aliases: ["x(", ":-t"] },
  { code: "B-)", name: "Kính râm sành điệu", symbol: "B-)", aliases: ["b-)"] },
  { code: ":-SS", name: "Toát mồ hôi lo sợ", symbol: ":-SS", aliases: [":-ss", ":SS", ":ss"] },
  { code: "=))", name: "Cười lăn lộn", symbol: "=))", aliases: [] },
  { code: "O:-)", name: "Thiên thần", symbol: "O:-)", aliases: ["o:-)", "0:-)"] },
  { code: ">:)", name: "Tiểu quỷ ranh mãnh", symbol: ">:)", aliases: [">:-)"] },
  { code: ":-B", name: "Mọt sách đáng yêu", symbol: ":-B", aliases: [":-b"] },
  { code: "^:)^", name: "Bái phục bái phục", symbol: "^:)^", aliases: [] },
  { code: ":>", name: "Cười mỉm đắc ý", symbol: ":>", aliases: [] },
  { code: ":-<", name: "Thở dài buồn bã", symbol: ":-<", aliases: [] },
  { code: "~:>", name: "Gà con líu lo", symbol: "~:>", aliases: [] },
  { code: "@};-", name: "Cành hoa hồng", symbol: "@};-", aliases: [] },
  { code: "%%-", name: "Cỏ 4 lá may mắn", symbol: "%%-", aliases: [] },
  { code: "**==", name: "Cờ phấp phới", symbol: "**==", aliases: [] },
  { code: "(~~)", name: "Tách cà phê", symbol: "(~~)", aliases: [] },
  { code: "~O)", name: "Tách trà nóng", symbol: "~O)", aliases: [] },
  { code: "*-:)", name: "Ý tưởng lóe sáng", symbol: "*-:)", aliases: [] },
  { code: "8-X", name: "Đầu lâu bí ẩn", symbol: "8-X", aliases: ["8-x"] },
  { code: "(BUZZ)", name: "BUZZ rung chuyển!", symbol: "(BUZZ)", aliases: ["buzz", "BUZZ!"] },
];

export interface YahooAudibleDefinition {
  id: string;
  title: string;
  icon: string;
  soundType: "hey" | "buzz" | "missyou" | "woohoo" | "byebye" | "laugh";
  text: string;
}

export const YAHOO_AUDIBLES: YahooAudibleDefinition[] = [
  { id: "buzz", title: "BUZZ!!!", icon: "buzz", soundType: "buzz", text: "BUZZ!!!" },
  { id: "hey", title: "Hey! Có ai ở đó không?!", icon: "hey", soundType: "hey", text: "[Audible] Hey! Có ai ở đó không?!" },
  { id: "missyou", title: "Nhớ bạn quá!", icon: "missyou", soundType: "missyou", text: "[Audible] Nhớ bạn quá nè!" },
  { id: "woohoo", title: "WooHoo! Ăn mừng!", icon: "woohoo", soundType: "woohoo", text: "[Audible] WooHoo!! Tuyệt vời quá!" },
  { id: "laugh", title: "Hahaha / Cười ngất!", icon: "laugh", soundType: "laugh", text: "[Audible] Hahaha! Đau cả bụng =))" },
  { id: "byebye", title: "Bye Bye! Hẹn gặp lại!", icon: "byebye", soundType: "byebye", text: "[Audible] Bye Bye! Tạm biệt nhé!" },
];

export interface ImvironmentDefinition {
  id: string;
  name: string;
  icon: string;
  background: string;
  textColor?: string;
}

export const YAHOO_IMVIRONMENTS: ImvironmentDefinition[] = [
  { id: "classic", name: "Yahoo! Tím Classic", icon: "classic", background: "#ffffff", textColor: "#202020" },
  { id: "sunset", name: "Hoàng Hôn Ấm Áp", icon: "sunset", background: "linear-gradient(180deg, #fff7ed 0%, #fef3c7 40%, #ffedd5 100%)", textColor: "#431407" },
  { id: "matrix", name: "Matrix Không Gian Số", icon: "matrix", background: "#0a110a", textColor: "#22c55e" },
  { id: "aquarium", name: "Thủy Cung Xanh Ngắt", icon: "aquarium", background: "linear-gradient(180deg, #ecfeff 0%, #cffafe 60%, #a5f3fc 100%)", textColor: "#083344" },
  { id: "doodle", name: "Trang Giấy Kẻ Ô", icon: "doodle", background: "#fafaf9", textColor: "#1c1917" },
  { id: "stars", name: "Đêm Đầy Sao", icon: "stars", background: "linear-gradient(180deg, #09090b 0%, #1e1b4b 100%)", textColor: "#e0e7ff" },
];

export const YAHOO_FONTS = [
  "Tahoma",
  "Arial",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Verdana",
] as const;

export const YAHOO_FONT_SIZES = [
  { label: "Nhỏ (9pt)", value: "11px" },
  { label: "Chuẩn (10pt)", value: "13px" },
  { label: "Vừa (12pt)", value: "15px" },
  { label: "Lớn (14pt)", value: "18px" },
] as const;

export const YAHOO_TEXT_COLORS = [
  "#0000cc", // Classic Yahoo Blue
  "#cc0000", // Classic Yahoo Red
  "#008000", // Green
  "#660099", // Purple
  "#ff1493", // Deep Pink
  "#ff6600", // Orange
  "#008b8b", // Teal / Dark Cyan
  "#000000", // Black
  "#4b0082", // Indigo
  "#8b4513", // Saddle Brown
  "#2e8b57", // Sea Green
  "#b22222", // Firebrick
] as const;
