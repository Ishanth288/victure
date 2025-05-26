import { useState, useEffect } from 'react';
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DashboardStats,
  WelcomeDialog,
  useDashboardData
} from "@/components/dashboard";
import { OptimizedDashboardWidgets } from "@/components/dashboard/OptimizedDashboardWidgets";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceNotification } from "@/components/admin/MaintenanceNotification";
// Removed: import { PlanBanner } from "@/components/dashboard/PlanBanner";
// Removed: import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPostLoginOnboarding, setShowPostLoginOnboarding] = useState(false);
  // Removed: const [userPlan, setUserPlan] = useState<"FREE" | "PRO" | "PRO PLUS">("FREE");
  const { toast } = useToast();

  const {
    isLoading,
    totalRevenue,
    totalInventoryValue,
    totalPatients,
    lowStockItems,
  } = useDashboardData();

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('dashboard-help-seen');
    if (!hasSeenHelp) {
      setIsHelpOpen(true);
      localStorage.setItem('dashboard-help-seen', 'true');
    }

    const showOnboarding = localStorage.getItem('show-post-login-onboarding');
    if (showOnboarding === 'true') {
      setShowPostLoginOnboarding(true);
      localStorage.removeItem('show-post-login-onboarding');
    }

    // Removed: fetchUserPlan logic - this is now handled by DashboardLayout
  }, [toast]);

  return (
    <DashboardLayout>
      <ErrorBoundary>
        {showPostLoginOnboarding && <div className="mb-6">Welcome to your pharmacy dashboard!</div>}
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />

        <MaintenanceNotification />

        {/* Removed: <PlanBanner planType={userPlan} /> - This was the duplicate! */}

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <DashboardStats
            totalRevenue={totalRevenue}
            totalInventoryValue={totalInventoryValue}
            totalPatients={totalPatients}
            lowStockItems={lowStockItems}
          />

          <div className="flex justify-center">
            <OptimizedDashboardWidgets />
          </div>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}