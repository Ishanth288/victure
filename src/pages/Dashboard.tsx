
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DashboardStats,
  RevenueSection,
  DistributionSection,
  WelcomeDialog,
  DashboardWidgets,
  useDashboardData
} from "@/components/dashboard";
import { GrowthOpportunitiesChart } from '@/components/insights/GrowthOpportunitiesChart';
import { useToast } from "@/hooks/use-toast";
import { MaintenanceNotification } from "@/components/admin/MaintenanceNotification";
import { InventoryOptimization } from '@/components/ai/InventoryOptimization';

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
  } = useDashboardData();

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('dashboard-help-seen');
    if (!hasSeenHelp) {
      setIsHelpOpen(true);
      localStorage.setItem('dashboard-help-seen', 'true');
    }
    
    // Check if we should show post-login onboarding
    const showOnboarding = localStorage.getItem('show-post-login-onboarding');
    if (showOnboarding === 'true') {
      setShowPostLoginOnboarding(true);
      // Remove the flag so it doesn't show again on refresh
      localStorage.removeItem('show-post-login-onboarding');
    }
    
    // Check if the user just logged in by checking the URL params
    const url = new URL(window.location.href);
    const justLoggedIn = url.searchParams.get('just_logged_in');
    if (justLoggedIn === 'true') {
      // Show login success message with new styling
      toast({
        title: "Login Successful",
        description: "Welcome to your pharmacy dashboard!",
        variant: "success",
        duration: 5000,
      });
      
      // Remove the URL param so the message doesn't show again on refresh
      url.searchParams.delete('just_logged_in');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [toast]);

  return (
    <DashboardLayout>
      <ErrorBoundary>
        {showPostLoginOnboarding && <div className="mb-6">Welcome to your pharmacy dashboard!</div>}
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
        
        <MaintenanceNotification />
        
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueSection isLoading={isLoading} revenueData={revenueData} />
            <DistributionSection isLoading={isLoading} revenueDistribution={revenueDistribution} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <DashboardWidgets />
            </div>
            <div className="md:col-span-1">
              <InventoryOptimization />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GrowthOpportunitiesChart opportunities={[]} />
          </div>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
