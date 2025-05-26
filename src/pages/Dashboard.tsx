
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DashboardStats,
  WelcomeDialog,
  useDashboardData
} from "@/components/dashboard";
import { OptimizedDashboardWidgets } from "@/components/dashboard/OptimizedDashboardWidgets";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
import { useToast } from "@/hooks/use-toast";
import { MaintenanceNotification } from "@/components/admin/MaintenanceNotification";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPostLoginOnboarding, setShowPostLoginOnboarding] = useState(false);
  const [userPlan, setUserPlan] = useState<"Basic" | "Pro Plus" | "Premium">("Pro Plus");
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
    
    const url = new URL(window.location.href);
    const justLoggedIn = url.searchParams.get('just_logged_in');
    if (justLoggedIn === 'true') {
      toast({
        title: "Login Successful",
        description: "Welcome to your pharmacy dashboard!",
        variant: "success",
        duration: 5000,
      });
      
      url.searchParams.delete('just_logged_in');
      window.history.replaceState({}, document.title, url.toString());
    }

    // Fetch user plan
    const fetchUserPlan = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan_type')
            .eq('id', user.id)
            .single();
          
          if (profile?.plan_type) {
            setUserPlan(profile.plan_type as "Basic" | "Pro Plus" | "Premium");
          }
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      }
    };

    fetchUserPlan();
  }, [toast]);

  return (
    <DashboardLayout>
      <ErrorBoundary>
        {showPostLoginOnboarding && <div className="mb-6">Welcome to your pharmacy dashboard!</div>}
        <WelcomeDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
        
        <MaintenanceNotification />
        
        {/* Plan Banner with proper separation */}
        <PlanBanner planType={userPlan} />
        
        <div className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
          
          <DashboardStats 
            totalRevenue={totalRevenue}
            totalInventoryValue={totalInventoryValue}
            totalPatients={totalPatients}
            lowStockItems={lowStockItems}
          />
          
          {/* Centered 2-column layout for Task Management and Document Management */}
          <div className="flex justify-center">
            <OptimizedDashboardWidgets />
          </div>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
