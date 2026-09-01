import { Platform } from 'react-native';

export const APP_LOGO_URL = 'https://i.postimg.cc/HWbyVhCN/Green-and-Gold-D-Basket-Logo.png';

/**
 * 🎨 DigiLocal Official Color Palette & Design Tokens
 */
export const DigiLocalColors = {
  // 1. Primary Brand Identity (Maroon & Wine)
  primary: '#541D26',         // Main brand color, Primary CTA buttons, Stepper active circles, Top navigation headers, Brand logo text
  primaryHover: '#6B2732',    // Button pressed / active states, active tab backgrounds
  primaryLight: '#F7EEF0',    // Active role pills, Selected category badge background, Input active focus glow (10-15% opacity)

  // 2. Accent & Highlight Colors (Champagne Gold & Warm Sand)
  accentGold: '#C8A878',      // Button borders, Verified badges, Golden stars, Special promos, Secure Gateway tags
  accentGoldDark: '#A88B58',  // Icon highlights on dark backgrounds, Gold text on white
  warmSand: '#EEE5DA',        // Secondary action pills, Inactive filter tags, Category card subtle backdrops
  nudeSand: '#D6B7A5',        // Subtitle text on dark cards, Secondary pill borders

  // 3. Canvas, Surfaces & Typography Neutrals
  canvasBase: '#F8F6F0',      // Main screen background, Scaffold background, App page backdrops
  surfaceCard: '#FFFFFF',     // Pure white card surfaces, Modal sheets, Input field backgrounds
  surfaceIvory: '#FAF8F5',    // Secondary card containers, Left hero panels, Form section boxes
  textDark: '#211A19',        // Primary titles, Headings, High-contrast body text, Form labels
  textMuted: '#78716C',       // Subtitles, Placeholders, Timestamps, Delivery addresses
  border: '#E7DFD5',          // Card borders, Input outline borders, Divider lines

  // 4. Functional & Status Feedback Colors
  success: '#16A34A',         // Order Delivered, OTP Verified, Store Open Badge
  successBg: '#F0FDF4',       // Success Banner / Toast background
  warning: '#D97706',         // Pending Approval, Unsaved Changes, Payment Processing
  warningBg: '#FFFBEB',       // Warning Alert pill background
  danger: '#DC2626',          // Delete Account, Cancel Order, Invalid Input Error
  dangerBg: '#FEF2F2',        // Error Banner / Validation error text background
  info: '#2563EB',            // Informational tags
  infoBg: '#EFF6FF',          // Info banner background
} as const;

export const BrandTheme = {
  ...DigiLocalColors,
  // Backward compatibility alias keys
  warmOffWhite: DigiLocalColors.canvasBase,
  creamCanvas: DigiLocalColors.surfaceIvory,
  forestGreen: DigiLocalColors.primary,
  darkForestGreen: DigiLocalColors.textDark,
  obsidianDarkGreen: DigiLocalColors.primaryHover,
  warmTanGold: DigiLocalColors.accentGold,
  accentYellowGold: DigiLocalColors.accentGold,
  mutedSageText: DigiLocalColors.textMuted,
  sandBorder: DigiLocalColors.border,
  emeraldGreen: DigiLocalColors.success,
};

export const Colors = {
  light: {
    primary: DigiLocalColors.primary,
    primaryHover: DigiLocalColors.primaryHover,
    primaryLight: DigiLocalColors.primaryLight,
    primaryCard: DigiLocalColors.primary,
    background: DigiLocalColors.canvasBase,
    backgroundElement: DigiLocalColors.surfaceIvory,
    backgroundSelected: DigiLocalColors.warmSand,
    surface: DigiLocalColors.surfaceCard,
    card: DigiLocalColors.surfaceCard,
    cardIvory: DigiLocalColors.surfaceIvory,
    text: DigiLocalColors.textDark,
    textDark: DigiLocalColors.textDark,
    textSecondary: DigiLocalColors.textMuted,
    textMuted: DigiLocalColors.textMuted,
    cardBorder: DigiLocalColors.border,
    border: DigiLocalColors.border,
    borderSubtle: DigiLocalColors.border,
    accent: DigiLocalColors.accentGold,
    accentGold: DigiLocalColors.accentGold,
    accentGoldDark: DigiLocalColors.accentGoldDark,
    warmSand: DigiLocalColors.warmSand,
    nudeSand: DigiLocalColors.nudeSand,
    gold: DigiLocalColors.accentGold,
    success: DigiLocalColors.success,
    successBg: DigiLocalColors.successBg,
    warning: DigiLocalColors.warning,
    warningBg: DigiLocalColors.warningBg,
    danger: DigiLocalColors.danger,
    dangerBg: DigiLocalColors.dangerBg,
    info: DigiLocalColors.info,
    infoBg: DigiLocalColors.infoBg,
  },
  dark: {
    primary: DigiLocalColors.accentGold,
    primaryHover: DigiLocalColors.accentGoldDark,
    primaryLight: 'rgba(84, 29, 38, 0.3)',
    primaryCard: '#2A1217',
    background: '#1A0E11',
    backgroundElement: '#241418',
    backgroundSelected: '#36181E',
    surface: '#241418',
    card: '#241418',
    cardIvory: '#2D181E',
    text: DigiLocalColors.canvasBase,
    textDark: DigiLocalColors.canvasBase,
    textSecondary: DigiLocalColors.nudeSand,
    textMuted: DigiLocalColors.nudeSand,
    cardBorder: '#42222A',
    border: '#42222A',
    borderSubtle: '#42222A',
    accent: DigiLocalColors.accentGold,
    accentGold: DigiLocalColors.accentGold,
    accentGoldDark: DigiLocalColors.accentGoldDark,
    warmSand: '#36181E',
    nudeSand: DigiLocalColors.nudeSand,
    gold: DigiLocalColors.accentGold,
    success: '#22C55E',
    successBg: 'rgba(34, 197, 94, 0.15)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.15)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
