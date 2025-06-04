import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "./MobileLayout";
import { MobileDashboard } from "./MobileDashboard";
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
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAppAndAuth = async () => {
      console.log('MobileAppWrapper: Starting app initialization and auth check...');
      const isNative = Capacitor.isNativePlatform();
      console.log('Platform check - isNative:', isNative, 'Platform:', Capacitor.getPlatform());
      setIsNativeApp(isNative);

      if (isNative) {
        try {
          // Configure status bar with Apple-style blue theme
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#007AFF' });
          console.log('Native app status bar configured with Apple blue theme');

          // Prevent external navigation in native app
          document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            if (link && link.href && !link.href.startsWith(window.location.origin)) {
              e.preventDefault();
              console.log('Prevented external navigation to:', link.href);
            }
          });

          // Override window.open to prevent web leaks
          const originalOpen = window.open;
          window.open = (...args) => {
            console.log('Prevented window.open call in native app');
            return null;
          };

        } catch (error) {
          console.log('Status bar configuration failed:', error);
        }

        // Handle back button on mobile
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            CapacitorApp.exitApp();
          } else {
            window.history.back();
          }
        });
      }

      // Perform auth check
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        console.log('MobileAppWrapper: Auth check complete, isAuthenticated:', !!session);
        
        // Redirect authenticated mobile users to mobile dashboard
        if (session && (isNative || isMobile) && location.pathname === '/') {
          console.log('MobileAppWrapper: Redirecting authenticated mobile user to dashboard');
          navigate('/mobile');
        }
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

    // Fallback to set isCheckingAuth to false after a delay, in case auth check gets stuck
    const authCheckTimeout = setTimeout(() => {
      if (isCheckingAuth) {
        console.warn('MobileAppWrapper: Auth check timed out. Forcing isCheckingAuth to false.');
        setIsCheckingAuth(false);
        // If auth check times out, and app is not initialized, force initialization
        if (!isInitialized) {
          setIsInitialized(true);
          console.warn('MobileAppWrapper: Forcing isInitialized to true due to auth check timeout.');
        }
      }
    }, 10000); // 10 seconds timeout

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false); // Ensure this is false on auth state change
      console.log('MobileAppWrapper: Auth state changed, isAuthenticated:', !!session, 'event:', event, 'isCheckingAuth set to false in auth state change.');
      
      // Handle auth redirects for mobile
      if (session && (isNativeApp || isMobile)) {
        if (location.pathname === '/' || location.pathname === '/auth') {
          navigate('/mobile');
        }
      } else if (!session && location.pathname.startsWith('/mobile')) {
        navigate('/auth');
      }
    });

    return () => {
      clearTimeout(authCheckTimeout);
      subscription.unsubscribe();
    };
  }, [isNativeApp, isMobile, location.pathname, navigate, isInitialized, isCheckingAuth]);

  // Don't render anything until platform detection is complete
  if (!isInitialized || isCheckingAuth) {
    console.log(`MobileAppWrapper: Displaying loading spinner. Current state: isInitialized=${isInitialized}, isCheckingAuth=${isCheckingAuth}`);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center animate-bounce-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
          </div>
          <p className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">Victure Healthcare</p>
          <p className="text-body text-gray-600 dark:text-gray-400">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // For mobile devices, wrap with MobileLayout if authenticated
  if ((isNativeApp || isMobile) && isAuthenticated) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  // Show auth page for mobile apps if not authenticated
  if ((isNativeApp || isMobile) && !isAuthenticated && !location.pathname.includes('/auth')) {
    console.log('MobileAppWrapper: Showing auth screen for mobile.');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6 safe-area-all">
        <div className="card-glass p-8 w-full max-w-md shadow-2xl animate-bounce-in">
          <div className="text-center mb-8">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse-apple"></div>
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                <span className="text-2xl font-bold text-white">V</span>
              </div>
            </div>
            <h1 className="text-headline font-bold text-gray-900 dark:text-white mb-2">Victure Healthcare</h1>
            <p className="text-body text-gray-600 dark:text-gray-400">Your trusted pharmacy companion</p>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="w-full btn-apple bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 focus-ring shadow-2xl"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  // For desktop or non-mobile authenticated users, render normally
  return <>{children}</>;
}
