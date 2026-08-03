import { Platform } from 'react-native';

export const APP_LOGO_URL = process.env.EXPO_PUBLIC_APP_LOGO || 'https://imgh.in/host/ucila6';

export const Colors = {
  light: {
    primary: '#18281F',           // Dark Forest Green
    primaryCard: '#243A2D',       // Translucent Dark Green
    background: '#F8F5EE',        // Soft Warm Ivory Cream
    backgroundElement: '#EFE8D8', // Warm Sand Surface (alias)
    backgroundSelected: '#E4DCC9',// Soft Warm Sand (alias)
    surface: '#EFE8D8',           // Warm Sand Surface
    card: '#FFFFFF',              // Pure White
    text: '#18281F',              // Deep Dark Espresso
    textSecondary: '#6B7C70',     // Muted Sage Taupe
    cardBorder: '#E4DCC9',        // Soft Warm Sand
    accent: '#C4A066',            // Warm Tan Gold
    gold: '#C4A066',              // Warm Tan Gold
    success: '#1E3A29',           // Active / Grocery Green
    successBg: '#E8F2EA',
    warning: '#8C6B38',           // Pending / Bakery Gold
    warningBg: '#F9EFE2',
    danger: '#B91C1C',            // Error / Rejected Red
    dangerBg: '#FEE2E2',
    info: '#2C5282',              // Info Blue
    infoBg: '#EBF3F9',
  },
  dark: {
    primary: '#18281F',
    primaryCard: '#243A2D',
    background: '#121F18',
    backgroundElement: '#1E3227',
    backgroundSelected: '#2E4738',
    surface: '#1E3227',
    card: '#18281F',
    text: '#F8F5EE',
    textSecondary: '#94A69A',
    cardBorder: '#2E4738',
    accent: '#C4A066',
    gold: '#C4A066',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.15)',
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
  web: {
    sans: 'var(--font-sans)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
