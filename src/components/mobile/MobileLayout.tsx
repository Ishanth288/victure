
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    const checkPlatform = async () => {
      const isNative = Capacitor.isNativePlatform();
      setIsNativeApp(isNative);

      if (isNative) {
        // Configure status bar for mobile app
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#1e40af' });
      }
    };

    checkPlatform();
  }, []);

  if (isNativeApp || isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile-optimized header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Victure Pharmacy</h1>
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          </div>
        </div>
        
        {/* Content area with mobile padding */}
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
