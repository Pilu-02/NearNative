/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1677d8';
const tintColorDark = '#f8fbff';

export const AppTheme = {
  colors: {
    accent: '#1677d8',
    accentDeep: '#0d5fb0',
    accentSoft: '#e7f2ff',
    background: '#f3f7fb',
    border: '#dbe6f1',
    card: '#ffffff',
    cardAlt: '#f8fbff',
    danger: '#c62828',
    dangerSoft: '#ffebee',
    dark: '#0f1f36',
    darkMuted: '#8ca3bf',
    muted: '#5f7086',
    text: '#102033',
    white: '#ffffff',
  },
  radius: {
    lg: 20,
    xl: 28,
    pill: 999,
  },
  shadow: {
    card: {
      shadowColor: '#102033',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 3,
    },
    button: {
      shadowColor: '#1677d8',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 3,
    },
  },
  spacing: {
    screen: 20,
    section: 18,
    card: 18,
  },
};

export const Colors = {
  light: {
    text: AppTheme.colors.text,
    background: AppTheme.colors.background,
    tint: tintColorLight,
    icon: '#70839b',
    tabIconDefault: '#70839b',
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
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
