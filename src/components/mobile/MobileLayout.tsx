
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { hapticFeedback } from "@/utils/mobileUtils";

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
        try {
          // Configure status bar for mobile app
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#1e40af' });
          console.log('Native app status bar configured');
        } catch (error) {
          console.log('Status bar configuration failed:', error);
        }
      }
    };

    checkPlatform();
  }, []);

  const handleHeaderTap = async () => {
    if (isNativeApp) {
      await hapticFeedback('light');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      {/* Native Mobile Header - Distinct from web version */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
        style={{ 
          paddingTop: isNativeApp ? 'env(safe-area-inset-top, 20px)' : '0',
          paddingBottom: '16px'
        }}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">V</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Victure Pharmacy</h1>
              <p className="text-xs text-blue-100">
                {isNativeApp ? 'Mobile App' : 'Mobile Web'}
              </p>
            </div>
          </div>
          <div 
            className="w-8 h-8 bg-white/20 rounded-full cursor-pointer"
            onClick={handleHeaderTap}
          />
        </div>
      </div>
      
      {/* Mobile-optimized content area with native padding */}
      <div 
        className="relative"
        style={{ 
          paddingLeft: isNativeApp ? 'env(safe-area-inset-left, 16px)' : '16px',
          paddingRight: isNativeApp ? 'env(safe-area-inset-right, 16px)' : '16px',
          paddingBottom: isNativeApp ? 'env(safe-area-inset-bottom, 16px)' : '16px',
          paddingTop: '16px'
        }}
      >
        {children}
      </div>

      {/* Native app indicator */}
      {isNativeApp && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs z-50">
          Native App
        </div>
      )}
    </div>
  );
}
