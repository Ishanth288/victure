import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { hapticFeedback } from "@/utils/mobileUtils";
import { BottomTabBar } from "./BottomTabBar";
import { supabase } from "@/integrations/supabase/client";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const isMobile = useIsMobile();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsAuthChecking(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleHeaderTap = async () => {
    if (isNativeApp) {
      await hapticFeedback('light');
    }
  };

  // Determine if we should show authenticated UI elements
  const shouldShowAuthenticatedUI = isAuthenticated && 
                                   !isAuthChecking && 
                                   !window.location.pathname.includes('/auth') &&
                                   window.location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-50 select-none overflow-x-hidden">
      {/* Native Mobile Header - Only show when authenticated and not on auth/index pages */}
      {shouldShowAuthenticatedUI && (
        <header 
          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg relative"
          style={{ 
            paddingTop: isNativeApp ? 'env(safe-area-inset-top, 20px)' : '0',
            paddingBottom: '12px'
          }}
          role="banner"
          aria-label="Mobile header"
        >
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative flex items-center justify-between px-6 pt-3">
            <div className="flex items-center space-x-3">
              <button 
                className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
                onClick={handleHeaderTap}
                aria-label="Victure logo"
                type="button"
              >
                <span className="text-xl font-bold" aria-hidden="true">V</span>
              </button>
              <div>
                <h1 className="text-lg font-bold">Victure Healthcare Solutions</h1>
                <p className="text-xs text-teal-100 font-medium">
                  {isNativeApp ? 'Mobile App' : 'Mobile Web'}
                </p>
              </div>
            </div>
            
            {/* Connection indicator */}
            <div className="flex items-center space-x-2" role="status" aria-label="Connection status">
              <div 
                className="w-2 h-2 bg-green-400 rounded-full animate-pulse" 
                aria-hidden="true"
              ></div>
              <span className="text-xs text-teal-100">Online</span>
            </div>
          </div>
        </header>
      )}
      
      {/* Mobile-optimized content area with proper safe area handling */}
      <main 
        className={`relative bg-gray-50 min-h-screen ${shouldShowAuthenticatedUI ? 'pb-16' : 'pb-0'}`}
        style={{ 
          paddingLeft: isNativeApp ? 'env(safe-area-inset-left, 0px)' : '0px',
          paddingRight: isNativeApp ? 'env(safe-area-inset-right, 0px)' : '0px',
          paddingBottom: shouldShowAuthenticatedUI && isNativeApp ? 'calc(env(safe-area-inset-bottom, 0px) + 4rem)' : shouldShowAuthenticatedUI ? '4rem' : '0px'
        }}
        role="main"
        aria-label="Main content"
      >
        <div className="w-full h-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Bottom Tab Bar for mobile navigation - Only show when authenticated */}
      {shouldShowAuthenticatedUI && <BottomTabBar />}

      {/* Native app indicator - styled professionally */}
      {isNativeApp && (
        <div 
          className="fixed bottom-4 right-4 bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50 flex items-center space-x-1"
          role="status"
          aria-label="Native app indicator"
        >
          <div className="w-2 h-2 bg-white rounded-full" aria-hidden="true"></div>
          <span>Native</span>
        </div>
      )}
    </div>
  );
}
