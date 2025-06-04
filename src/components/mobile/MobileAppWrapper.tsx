
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

export function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    const initializeAppAndAuth = async () => {
      console.log('MobileAppWrapper: Starting app initialization and auth check...');
      const isNative = Capacitor.isNativePlatform();
      console.log('Platform check - isNative:', isNative, 'Platform:', Capacitor.getPlatform());
      setIsNativeApp(isNative);

      if (isNative) {
        try {
          // Configure status bar for teal green theme
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#14b8a6' });
          console.log('Native app status bar configured with teal theme');

          // Handle back button on mobile
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              CapacitorApp.exitApp();
            } else {
              window.history.back();
            }
          });
        } catch (error) {
          console.log('Status bar configuration failed:', error);
        }
      }

      // Perform auth check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        console.log('MobileAppWrapper: Auth check complete, isAuthenticated:', !!session);
      } catch (error) {
        console.error('MobileAppWrapper: Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
        console.log('MobileAppWrapper: isCheckingAuth set to false in finally block.');
      }
      setIsInitialized(true);
      console.log('MobileAppWrapper: isInitialized set to true after all initialization and auth check.');
    };

    initializeAppAndAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false);
      console.log('MobileAppWrapper: Auth state changed, isAuthenticated:', !!session, 'event:', event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Don't render anything until platform detection is complete
  if (!isInitialized || isCheckingAuth) {
    console.log(`MobileAppWrapper: Displaying loading spinner. Current state: isInitialized=${isInitialized}, isCheckingAuth=${isCheckingAuth}`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
        <div className="text-center text-white">
          <LoadingAnimation showLogo={true} text="Loading Victure Pharmacy..." size="lg" />
        </div>
      </div>
    );
  }

  // Just render the children without aggressive auth redirects
  return <>{children}</>;
}
