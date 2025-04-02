
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
import { PostLoginOnboarding } from "@/components/onboarding/PostLoginOnboarding";
import { GrowthOpportunitiesChart } from '@/components/insights/GrowthOpportunitiesChart';

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPostLoginOnboarding, setShowPostLoginOnboarding] = useState(false);
  
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
  }, []);

  return (
    <DashboardLayout>
      <ErrorBoundary>
        {showPostLoginOnboarding && <PostLoginOnboarding />}
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
        
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
            <GrowthOpportunitiesChart opportunities={[]} />
            <DashboardWidgets />
          </div>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
