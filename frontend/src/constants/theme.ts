import { Platform } from 'react-native';

export const APP_LOGO_URL = 'https://i.postimg.cc/HWbyVhCN/Green-and-Gold-D-Basket-Logo.png';

// Official Brand Color Palette System
export const BrandTheme = {
  warmOffWhite: '#EDEDE4',       // Primary Page Canvas & Hero Container Background
  creamCanvas: '#F7F4EE',        // Primary Cards & Container Backgrounds
  forestGreen: '#34533C',        // Primary Bento Containers & Header Frame
  darkForestGreen: '#18281F',    // Deep Dark Text & Primary Focal Areas
  obsidianDarkGreen: '#0B1610',  // Footer & Vendor Portal Dark Card Background
  warmTanGold: '#C4A066',        // Accent & Highlights, Arrow Icons, Active Accents
  accentYellowGold: '#E6C35C',   // Gold Accents & Active Badges
  mutedSageText: '#6B7C70',      // Secondary Subtitles, Captions & Metadata
  sandBorder: '#E4DCC9',         // Soft Card Borders & Dividers
  emeraldGreen: '#059669',       // Verified Store Badges & Online Indicators
};

export const Colors = {
  light: {
    primary: BrandTheme.forestGreen,
    primaryCard: BrandTheme.darkForestGreen,
    background: BrandTheme.warmOffWhite,
    backgroundElement: BrandTheme.creamCanvas,
    backgroundSelected: BrandTheme.sandBorder,
    surface: BrandTheme.creamCanvas,
    card: BrandTheme.creamCanvas,
    text: BrandTheme.darkForestGreen,
    textSecondary: BrandTheme.mutedSageText,
    cardBorder: BrandTheme.sandBorder,
    accent: BrandTheme.warmTanGold,
    gold: BrandTheme.warmTanGold,
    success: BrandTheme.emeraldGreen,
    successBg: '#E8F2EA',
    warning: '#8C6B38',
    warningBg: '#F9EFE2',
    danger: '#B91C1C',
    dangerBg: '#FEE2E2',
    info: '#2C5282',
    infoBg: '#EBF3F9',
  },
  dark: {
    primary: BrandTheme.forestGreen,
    primaryCard: BrandTheme.obsidianDarkGreen,
    background: BrandTheme.obsidianDarkGreen,
    backgroundElement: BrandTheme.darkForestGreen,
    backgroundSelected: BrandTheme.forestGreen,
    surface: BrandTheme.darkForestGreen,
    card: BrandTheme.darkForestGreen,
    text: BrandTheme.creamCanvas,
    textSecondary: BrandTheme.mutedSageText,
    cardBorder: BrandTheme.sandBorder,
    accent: BrandTheme.warmTanGold,
    gold: BrandTheme.accentYellowGold,
    success: BrandTheme.emeraldGreen,
    successBg: 'rgba(5, 150, 105, 0.15)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.15)',
    danger: '#F87171',
    dangerBg: 'rgba(248, 113, 113, 0.15)',
    info: '#60A5FA',
    infoBg: 'rgba(96, 165, 250, 0.15)',
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
