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
  const [currentView, setCurrentView] = useState('dashboard');
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkPlatform = () => {
      setIsNativeApp(Capacitor.isNativePlatform());
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

  // If it's a mobile app, show mobile-optimized interface
  if (isNativeApp || isMobile) {
    return (
      <MobileLayout>
        <MobileDashboard />
      </MobileLayout>
    );
  }

  // Otherwise, show regular web interface
  return <>{children}</>;
}
