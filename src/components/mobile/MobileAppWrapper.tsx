
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "./MobileLayout";
import { MobileDashboard } from "./MobileDashboard";

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
    const initializeApp = async () => {
      const isNative = Capacitor.isNativePlatform();
      console.log('Platform check - isNative:', isNative, 'Platform:', Capacitor.getPlatform());
      setIsNativeApp(isNative);

      if (isNative) {
        try {
          // Configure status bar for teal green theme
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#14b8a6' });
          console.log('Native app status bar configured with teal theme');

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

      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setIsCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything until platform detection is complete
  if (!isInitialized || isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold">Victure Pharmacy</div>
          <div className="text-sm opacity-75">Loading...</div>
        </div>
      </div>
    );
  }

  // Show auth page for mobile apps if not authenticated
  if ((isNativeApp || isMobile) && !isAuthenticated && location.pathname !== '/auth') {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">V</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Victure Pharmacy</h1>
              <p className="text-gray-600">Your trusted pharmacy companion</p>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Priority: Native app first, then mobile web, then desktop web
  if (isNativeApp || isMobile) {
    console.log(`Rendering ${isNativeApp ? 'native' : 'mobile web'} interface`);
    
    // Special handling for mobile dashboard (root path)
    if (location.pathname === '/' && isAuthenticated) {
      return (
        <MobileLayout>
          <MobileDashboard />
        </MobileLayout>
      );
    }

    // For other mobile routes, wrap in mobile layout
    if (location.pathname.startsWith('/mobile/') || 
        ['/auth', '/billing', '/prescriptions', '/insights'].includes(location.pathname)) {
      return (
        <MobileLayout>
          {children}
        </MobileLayout>
      );
    }

    // Default mobile dashboard for root
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
