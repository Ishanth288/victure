import { useState, useEffect } from 'react';
import DashboardLayout from "../components/DashboardLayout";
import { InventoryProvider } from "../contexts/InventoryContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DashboardStats,
  WelcomeDialog,
  useDashboardData
} from "@/components/dashboard";
import { OptimizedDashboardWidgets } from "@/components/dashboard/OptimizedDashboardWidgets";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceNotification } from "@/components/admin/MaintenanceNotification";

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPostLoginOnboarding, setShowPostLoginOnboarding] = useState(false);
  const { toast } = useToast();

  const {
    isLoading,
    totalRevenue,
    totalInventoryValue,
    totalPatients,
    lowStockItems,
    revenueData,
    revenueDistribution,
    refreshAllDashboardData
  } = useDashboardData();

  useEffect(() => {
    refreshAllDashboardData();
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
  }, [toast]);

  return (
    <InventoryProvider>
      <DashboardLayout>
        <ErrorBoundary>
        {showPostLoginOnboarding && <div className="mb-6">Welcome to your pharmacy dashboard!</div>}
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />

        <MaintenanceNotification />

        <div className="space-y-8 p-4 md:p-8 lg:p-12 bg-gray-50 rounded-lg shadow-inner">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          </div>

          <DashboardStats
            isLoading={isLoading}
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
    </InventoryProvider>
  );
}
