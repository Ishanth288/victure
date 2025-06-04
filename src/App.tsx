
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { supabase } from "@/integrations/supabase/client";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { MobileGuard } from "@/components/mobile/MobileGuard";
import MobileDashboard from "@/components/mobile/MobileDashboard";
import OptimizedMobileInventory from "@/components/mobile/OptimizedMobileInventory";
import OptimizedMobilePatients from "@/components/mobile/OptimizedMobilePatients";
import MobileSettings from "@/components/mobile/MobileSettings";

function App() {
  const isMobile = useIsMobile();
  const { isOnline, isSupabaseConnected } = useConnectionStatus();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        setSession(session);
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <ErrorBoundary>
        <Auth />
        <Toaster />
      </ErrorBoundary>
    );
  }

  // Show connection status for business-critical scenarios
  if (!isOnline || !isSupabaseConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {!isOnline ? "You're Offline" : "Connecting to Database..."}
          </h2>
          <p className="text-gray-600 mb-4">
            {!isOnline 
              ? "Please check your internet connection to continue using the app."
              : "We're working to restore your connection. Your data is safe."
            }
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <InventoryProvider>
        <MobileGuard>
          {isMobile ? (
            <MobileLayout>
              <Routes>
                <Route path="/" element={<MobileDashboard />} />
                <Route path="/mobile/inventory" element={<OptimizedMobileInventory />} />
                <Route path="/mobile/patients" element={<OptimizedMobilePatients />} />
                <Route path="/mobile/settings" element={<MobileSettings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MobileLayout>
          ) : (
            <Routes>
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/mobile/*" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
        </MobileGuard>
        <Toaster />
      </InventoryProvider>
    </ErrorBoundary>
  );
}

export default App;
