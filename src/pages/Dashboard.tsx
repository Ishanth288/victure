
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
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceNotification } from "@/components/admin/MaintenanceNotification";
import { Card, CardContent } from "@/components/ui/card";

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
      // Show login success message
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
        {showPostLoginOnboarding && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-primary">Welcome to your pharmacy dashboard!</h2>
              <p className="text-gray-600 mt-2">
                Get started by exploring your inventory, managing prescriptions, or viewing insights about your pharmacy.
              </p>
            </CardContent>
          </Card>
        )}
        
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
        
        <MaintenanceNotification />
        
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          </div>
          
          <DashboardStats 
            totalRevenue={totalRevenue}
            totalInventoryValue={totalInventoryValue}
            totalPatients={totalPatients}
            lowStockItems={lowStockItems}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueSection isLoading={isLoading} revenueData={revenueData} />
            <DistributionSection isLoading={isLoading} revenueDistribution={revenueDistribution} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GrowthOpportunitiesChart opportunities={[]} />
            <DashboardWidgets />
          </div>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
