
import { Capacitor } from "@capacitor/core";

export const isMobileApp = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (isMobileApp()) {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    const hapticStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];

    await Haptics.impact({ style: hapticStyle });
  }
};
