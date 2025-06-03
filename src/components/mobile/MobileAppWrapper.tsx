
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./MobileLayout";
import { MobileDashboard } from "./MobileDashboard";

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkPlatform = () => {
      const isNative = Capacitor.isNativePlatform();
      console.log('Platform check - isNative:', isNative, 'Platform:', Capacitor.getPlatform());
      setIsNativeApp(isNative);
      setIsInitialized(true);
    };

    checkPlatform();

    // Handle back button on mobile
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }, []);

  // Don't render anything until platform detection is complete
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Priority: Native app first, then mobile web, then desktop web
  if (isNativeApp) {
    console.log('Rendering native mobile app interface');
    return (
      <MobileLayout>
        <MobileDashboard />
      </MobileLayout>
    );
  }

  if (isMobile) {
    console.log('Rendering mobile web interface');
    return (
      <MobileLayout>
        <MobileDashboard />
      </MobileLayout>
    );
  }

  // Desktop web interface
  console.log('Rendering desktop web interface');
  return <>{children}</>;
}
