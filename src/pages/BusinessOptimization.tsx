
import { useState, useCallback, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import IntelligentInventorySection from "@/components/dashboard/IntelligentInventorySection";
import AdvancedSalesForecastingSection from "@/components/dashboard/AdvancedSalesForecastingSection";
import SupplierPurchaseOptimizationSection from "@/components/dashboard/SupplierPurchaseOptimizationSection";
import SalesCustomerRelationshipSection from "@/components/dashboard/SalesCustomerRelationshipSection";
import KpiCard from "@/components/dashboard/KpiCard";
import ModernLoading from "@/components/ui/modern-loading";
import Skeleton, { SkeletonGroup } from "@/components/ui/skeleton-loader";
import { stableToast } from "@/components/ui/stable-toast";
import { displayErrorMessage } from "@/utils/errorHandling";

import { useAuth } from "@/hooks/useAuth";
import { useSalesStats } from "@/hooks/use-sales-stats";
import { useProductData } from "@/hooks/use-product-data";
import { formatCurrency } from "@/utils/mobileUtils";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
import { PlanLimitAlert } from "@/components/PlanLimitAlert";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function BusinessOptimization() {
  const { user, loading: authLoading, ready } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Date range for analytics
  const [dateRange] = useState(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { from: thirtyDaysAgo, to: today };
  });
  
  // Data hooks
  const { 
    totalSales, 
    averageOrderValue, 
    customerRetentionRate, 
    isLoading: salesLoading, 
    error: salesError, 
    refreshSalesStats 
  } = useSalesStats(user?.id || null, dateRange);
  
  const { 
    topProducts, 
    isLoading: productsLoading, 
    error: productsError, 
    refreshProductData 
  } = useProductData(user?.id || null, dateRange);
  
  // Handle authentication errors
  useEffect(() => {
    if (!user && ready && !authLoading) {
      setAuthError('Authentication required to access business optimization features');
    } else if (user && ready) {
      setAuthError(null);
    }
  }, [user, ready, authLoading]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setAuthError(null);
    
    stableToast({
      title: "Refreshing data...",
      description: "Loading the latest business insights.",
      variant: "default"
    });
    
    try {
      await Promise.all([
        refreshSalesStats(),
        refreshProductData(),
      ]);
    } catch (err) {
      displayErrorMessage(err, 'Failed to refresh data');
    } finally {
      setIsRetrying(false);
    }
  }, [refreshSalesStats, refreshProductData]);

  // Loading and error states
  const isInitialLoading = authLoading || !ready;
  const isDataLoading = user && (salesLoading || productsLoading);
  const dataError = salesError || productsError;
  const hasDataError = authError || (user && dataError);

  // Show initial loading (authentication)
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-6">
          <Skeleton variant="dashboard" />
        </div>
      </div>
    );
  }

  // Show error state
      if (hasDataError && !isRetrying) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50">
            <div className="text-center space-y-6 p-8 max-w-md">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {!user ? 'Authentication Required' : 'Unable to Load Data'}
                </h3>
                <p className="text-gray-600">
                  {!user 
                    ? 'Please log in to access your business optimization dashboard.' 
                    : dataError?.message || 'There was an issue loading your business data. Please try again.'}
                </p>
              </div>
              {user && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </button>
              )}
            </div>
          </div>
        );
      }
  // Main content with progressive loading
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-indigo-900 tracking-tight">
              Business Optimization Hub
            </h1>
            <p className="text-lg text-indigo-600 max-w-2xl mx-auto">
              Unlock insights and streamline your pharmacy operations with real-time analytics.
            </p>
          </div>
        </header>

        {/* KPI Section */}
        <section className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
              Key Performance Indicators
              {isDataLoading && (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isDataLoading ? (
                // Skeleton loading for KPIs
                <>
                  <Skeleton variant="kpi" />
                  <Skeleton variant="kpi" />
                  <Skeleton variant="kpi" />
                  <Skeleton variant="kpi" />
                </>
              ) : (
                // Actual KPI data
                <>
                  <KpiCard
                    title="Total Sales"
                    value={formatCurrency(totalSales)}
                    isLoading={false}
                  />
                  <KpiCard
                    title="Average Order Value"
                    value={formatCurrency(averageOrderValue)}
                    isLoading={false}
                  />
                  <KpiCard
                    title="Customer Retention"
                    value={`${customerRetentionRate}%`}
                    isLoading={false}
                  />
                  <KpiCard
                    title="Top Products"
                    value={topProducts?.length?.toString() || '0'}
                    isLoading={false}
                  />
                </>
              )}
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <div className="space-y-8">
          {isDataLoading ? (
            // Skeleton loading for feature sections
            <SkeletonGroup count={4} variant="card" containerClassName="space-y-6" />
          ) : (
            // Actual feature sections
            <>
              <IntelligentInventorySection />
              <AdvancedSalesForecastingSection />
              <SupplierPurchaseOptimizationSection />
              <SalesCustomerRelationshipSection />
            </>
          )}
          
          {/* Footer message */}
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              We're continuously developing new features to empower your business. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}