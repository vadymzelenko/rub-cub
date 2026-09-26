// Единая дизайн-система приложения.
// Стиль: строгий, инженерный (Vercel v0.dev) — плоские поверхности,
// тонкие hairline-границы вместо теней, один акцентный цвет,
// используемый только для активных/интерактивных состояний.

export const COLORS = {
  bg: 0x0a0a0a,
  bgHex: '#0A0A0A',
  surface: 0x141414,
  surfaceHex: '#141414',
  surface2: 0x1c1c1c,
  surface2Hex: '#1C1C1C',
  text: 0xededed,
  textHex: '#EDEDED',
  muted: 0x888888,
  mutedHex: '#888888',
  border: 0x262626,
  borderHex: '#262626',
  accent: 0x3b82f6,
  accentHex: '#3B82F6',
  accentDim: 0x1d4ed8,
  accentDimHex: '#1D4ED8',
  danger: 0xef4444,
  dangerHex: '#EF4444',
  success: 0x22c55e,
  successHex: '#22C55E',
};

// Реальные HEX-цвета наклеек кубика — используются в 3D, сканере и ручном вводе.
export const CUBE_COLORS = {
  U: 0xffffff, // Up    — белый
  D: 0xffd500, // Down  — жёлтый
  F: 0x009e60, // Front — зелёный
  B: 0x0051ba, // Back  — синий
  L: 0xff5800, // Left  — оранжевый
  R: 0xc41e3a, // Right — красный
};

export const FONT = {
  family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  mono: 'JetBrains Mono, ui-monospace, monospace',
  sizes: {
    xs: 13,
    sm: 15,
    base: 17,
    lg: 22,
    xl: 28,
    xxl: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
};

// Брейкпоинты по ширине логического viewport (Phaser Scale.FIT)
export const BREAKPOINTS = {
  phone: 480,
  tablet: 1024,
};

export function isTablet(width) {
  return width >= BREAKPOINTS.tablet;
}

export const MOTION = {
  fast: 120,
  base: 200,
  slow: 320,
  ease: 'Cubic.easeOut',
  easeIn: 'Cubic.easeIn',
};
