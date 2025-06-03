
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
          // Configure status bar with teal theme
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#14b8a6' });
          console.log('Native app status bar configured with teal theme');
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
    <div className="min-h-screen bg-gray-50 select-none overflow-x-hidden">
      {/* Native Mobile Header - Optimized for professional appearance */}
      {!window.location.pathname.includes('/auth') && (
        <div 
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg relative"
          style={{ 
            paddingTop: isNativeApp ? 'env(safe-area-inset-top, 20px)' : '0',
            paddingBottom: '12px'
          }}
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative flex items-center justify-between px-6 pt-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                onClick={handleHeaderTap}
              >
                <span className="text-xl font-bold">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Victure Pharmacy</h1>
                <p className="text-xs text-teal-100 font-medium">
                  {isNativeApp ? 'Mobile App' : 'Mobile Web'}
                </p>
              </div>
            </div>
            
            {/* Connection indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-teal-100">Online</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile-optimized content area with proper safe area handling */}
      <div 
        className="relative bg-gray-50 min-h-screen"
        style={{ 
          paddingLeft: isNativeApp ? 'env(safe-area-inset-left, 0px)' : '0px',
          paddingRight: isNativeApp ? 'env(safe-area-inset-right, 0px)' : '0px',
          paddingBottom: isNativeApp ? 'env(safe-area-inset-bottom, 0px)' : '0px'
        }}
      >
        {children}
      </div>

      {/* Native app indicator - styled professionally */}
      {isNativeApp && (
        <div className="fixed bottom-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50 flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span>Native</span>
        </div>
      )}
    </div>
  );
}
