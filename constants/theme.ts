import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const COLORS = {
  primary: '#2DD4BF',
  primaryDark: '#0D9488',
  primaryLight: '#CCFBF1',
  sidebarBg: '#0A0A5C',
  sidebarActive: '#2DD4BF',
  sidebarText: '#A0AEC0',
  sidebarActiveText: '#FFFFFF',
  background: 'hsl(230, 22%, 56%)',
  cardBg: '#FFFFFF',
  textPrimary: '#1A202C',
  textSecondary: '#718096',
  alertRed: '#FC8181',
  alertPurple: '#9F7AEA',
  alertGreen: '#68D391',
  white: '#FFFFFF',
};