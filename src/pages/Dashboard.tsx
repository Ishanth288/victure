
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  DashboardStats,
  RevenueSection,
  DistributionSection,
  ProductsSection,
  TrendSection,
  WelcomeDialog,
  DashboardWidgets,
  useDashboardData
} from "@/components/dashboard";

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const {
    isLoading,
    totalRevenue,
    totalInventoryValue,
    totalPatients,
    lowStockItems,
    revenueData,
    topProducts,
    revenueDistribution,
    trendData
  } = useDashboardData();

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('dashboard-help-seen');
    if (!hasSeenHelp) {
      setIsHelpOpen(true);
      localStorage.setItem('dashboard-help-seen', 'true');
    }
  }, []);

  return (
    <DashboardLayout>
      <ErrorBoundary>
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
            <ProductsSection isLoading={isLoading} topProducts={topProducts} />
            <TrendSection trendData={trendData} />
          </div>
          
          <DashboardWidgets />
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
