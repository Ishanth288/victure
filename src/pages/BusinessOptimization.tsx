
import { useState, useCallback, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import IntelligentInventorySection from "@/components/dashboard/IntelligentInventorySection"; // Import the new section component
import AdvancedSalesForecastingSection from "@/components/dashboard/AdvancedSalesForecastingSection"; // Import the new section component
import SupplierPurchaseOptimizationSection from "@/components/dashboard/SupplierPurchaseOptimizationSection"; // Import the new section component
import SalesCustomerRelationshipSection from "@/components/dashboard/SalesCustomerRelationshipSection"; // Import the new section component
import KpiCard from "@/components/dashboard/KpiCard"; // Import the new KpiCard component
import { Fallback, ErrorFallback } from "@/components/ui/fallback";
import { stableToast } from "@/components/ui/stable-toast";
import { displayErrorMessage } from "@/utils/errorHandling";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSalesStats } from "@/hooks/use-sales-stats";
import { useProductData } from "@/hooks/use-product-data";
import { formatCurrency } from "@/utils/mobileUtils";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";

export default function BusinessOptimization() {
  const { user } = useAuth();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const dateRange = { from: thirtyDaysAgo, to: today };
  const {
    totalSales,
    averageOrderValue,
    customerRetentionRate,
    isLoading: salesLoading
  } = useSalesStats(user?.id || null, dateRange);
  const { topProducts, isLoading: productsLoading } = useProductData(user?.id || null, dateRange);
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  const [kpiData, setKpiData] = useState<any>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  
  const handleError = useCallback((error: Error) => {
    console.error("BusinessOptimization page error:", error);
    setHasError(true);
    setErrorDetails(error);
    
    // Show error toast with 4 second auto-dismiss
    displayErrorMessage(error, "Business Optimization");
  }, []);

  // Simulate fetching KPI data
  const fetchKpiData = useCallback(() => {
    setKpiLoading(true);
    setTimeout(() => {
      setKpiData({
        totalSales: Math.floor(Math.random() * 50000) + 10000,
        inventoryTurnover: (Math.random() * 10 + 2).toFixed(1),
        customerRetention: Math.floor(Math.random() * 30) + 60,
        averageOrderValue: Math.floor(Math.random() * 1500) + 500,
      });
      setKpiLoading(false);
    }, 1500); // Simulate network delay
  }, []);

  // Fetch initial KPI data on component mount
  useEffect(() => {
    fetchKpiData();
  }, [fetchKpiData]);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setHasError(false);
    setErrorDetails(null);
    
    stableToast({
      title: "Retrying...",
      description: "Attempting to load business optimization data again.",
      variant: "default"
    });
    
    setTimeout(() => {
      setIsRetrying(false);
      // Simulate fetching KPI data on retry
      fetchKpiData();
    }, 500);
  }, [fetchKpiData]);

  if (hasError) {
    return (
        <div className="h-full flex items-center justify-center transition-opacity duration-300 ease-in-out">
          <ErrorFallback 
            message="Business optimization data could not be loaded." 
            error={errorDetails}
            onRetry={handleRetry}
          />
        </div>
    );
  }

  if (salesLoading || kpiLoading) {
    return (
        <Fallback message="Loading business optimization data..." />
    );
  }
  return (
    <>
      {/* PlanBanner is already rendered by DashboardLayout with correct planType, so remove this duplicate */}
      <PlanLimitAlert currentValue={totalSales} maxValue={100000} resourceName="Sales" />
      <div className="container mx-auto px-0 py-4">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Business Optimization Hub</h1>
          <p className="text-lg text-gray-600 mt-2">Unlock insights and streamline your pharmacy operations.</p>
        </header>
        <div className="grid grid-cols-1 gap-4">
          <section id="new-kpi-section" className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total Sales"
                value={salesLoading ? 0 : formatCurrency(totalSales)}
                isLoading={salesLoading}
              />
              <KpiCard
                title="Average Order Value"
                value={salesLoading ? 0 : formatCurrency(averageOrderValue)}
                isLoading={salesLoading}
              />
              <KpiCard
                title="Customer Retention"
                value={salesLoading ? 0 : `${customerRetentionRate}%`}
                isLoading={salesLoading}
              />
              {/* Add more KPIs as needed */}
            </div>
          </section>
          {/* Feature Sections */}
          <div className="space-y-10">
            <IntelligentInventorySection userId={user?.id} />
            <AdvancedSalesForecastingSection userId={user?.id} />
            <SupplierPurchaseOptimizationSection userId={user?.id} />
            <SalesCustomerRelationshipSection userId={user?.id} />
            <p className="text-center text-gray-500 mt-10 py-4">We're continuously developing new features to empower your business. Stay tuned!</p>
          </div>
        </div>
      </div>
    </>
  );
}