/**
 * 🎨 DigiLocal Official Color Palette & Design Tokens
 */
export const DigiLocalColors = {
  // 1. Primary Brand Identity (Maroon & Wine)
  primary: '#541D26',
  primaryHover: '#6B2732',
  primaryLight: '#F7EEF0',

  // 2. Accent & Highlight Colors (Champagne Gold & Warm Sand)
  accentGold: '#C8A878',
  accentGoldDark: '#A88B58',
  warmSand: '#EEE5DA',
  nudeSand: '#D6B7A5',

  // 3. Canvas, Surfaces & Typography Neutrals
  canvasBase: '#F8F6F0',
  surfaceCard: '#FFFFFF',
  surfaceIvory: '#FAF8F5',
  textDark: '#211A19',
  textMuted: '#78716C',
  border: '#E7DFD5',

  // 4. Functional & Status Feedback Colors
  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
} as const;

export const Colors = {
  ...DigiLocalColors,
  // Backward compatibility keys
  warmOffWhite: DigiLocalColors.canvasBase,
  creamCanvas: DigiLocalColors.surfaceIvory,
  forestGreen: DigiLocalColors.primary,
  darkForestGreen: DigiLocalColors.textDark,
  obsidianDarkGreen: DigiLocalColors.primaryHover,
  emeraldGreen: DigiLocalColors.success,
  warmTanGold: DigiLocalColors.accentGold,
  accentYellowGold: DigiLocalColors.accentGold,
  mutedSageText: DigiLocalColors.textMuted,
  sandBorder: DigiLocalColors.border,
};

export default Colors;
