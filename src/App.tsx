
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { InventoryProvider } from "@/contexts/InventoryContext";
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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
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
    return <Auth />;
  }

  return (
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
  );
}

export default App;
