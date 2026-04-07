import { useTheme } from '@/context/theme';

export function useThemeColors() {
  const { isDark } = useTheme();

  const light = {
    background: '#F7FAFC',
    text: '#1A202C',
    primary: '#1C3165',
    accent: '#1C3165',
    card: '#FFFFFF',
    border: '#EDF2F7',
    subtext: '#718096',
    iconHeader: '#1C3165',
    iconBg: '#EBF4FF',
    statusTag: '#EBF4FF',
    statusText: '#1C3165',
    transparentHeader: 'rgba(255,255,255,0.7)',
    white: '#FFFFFF',
    navy: '#1C3165',
  };

  const dark = {
    background: '#050B1F', // Deep space navy
    text: '#FFFFFF',
    primary: '#1A2A51', // Lighter navy for visibility
    accent: '#8A9DBA',
    card: '#1C3165', // Signature navy becomes card
    border: '#1D2A51',
    subtext: '#A0AEC0',
    iconHeader: '#FFFFFF',
    iconBg: '#1D2A51',
    statusTag: '#1D2A51',
    statusText: '#8A9DBA',
    transparentHeader: 'rgba(5,11,31,0.7)',
    white: '#FFFFFF',
    navy: '#1C3165',
  };

  return isDark ? dark : light;
}
