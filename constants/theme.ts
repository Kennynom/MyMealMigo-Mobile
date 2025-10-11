/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// MyMealMigo brand colors
const primaryGreen = '#58e221';
const tintColorLight = primaryGreen;
const tintColorDark = primaryGreen;

export const Colors = {
  light: {
    text: '#000000',  // ← Changed to pure black
    background: '#fff',
    surface: '#fff',
    textSecondary: '#333333',  // ← Changed to darker grey
    border: '#f0f0f0',
    inactive: '#f8f8f8',
    card: '#fff',
    transparent: 'transparent',
    
    // MyMealMigo brand colors
    primary: primaryGreen,
    primaryDark: '#059669',
    accent: '#059669',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    
    // Original theme colors
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    
    // Shadow
    shadow: '#000000',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    surface: '#2d2d2d',
    textSecondary: '#9BA1A6',
    border: '#404040',
    inactive: '#404040',
    card: '#2d2d2d',
    transparent: 'transparent',
    
    // MyMealMigo brand colors (same in dark mode)
    primary: primaryGreen,
    primaryDark: '#059669',
    accent: '#059669',
    
    // Status colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    
    // Original theme colors
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Shadow
    shadow: '#000000',
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
