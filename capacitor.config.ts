
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a3c8bd8d7a934cc2959c4ea6cb151f36',
  appName: 'Victure Pharmacy',
  webDir: 'dist',
  //server: {
  //  url: 'https://a3c8bd8d-7a93-4cc2-959c-4ea6cb151f36.lovableproject.com?forceHideBadge=true',
  //  cleartext: true
  //},
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e40af',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#1e40af',
    },
  },
};

export default config;
