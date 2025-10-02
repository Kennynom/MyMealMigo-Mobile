// utils/platform.js
import { Platform, Dimensions } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isDesktop = () => {
  if (!isWeb) return false;
  const { width } = Dimensions.get('window');
  return width > 768; // Desktop breakpoint
};