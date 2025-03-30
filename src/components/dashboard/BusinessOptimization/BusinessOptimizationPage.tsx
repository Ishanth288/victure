
import { useState, useCallback, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Tabs } from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusinessData } from "./hooks/useBusinessData";
import { useLoadingState } from "./hooks/useLoadingState";
import { useDataRefresh } from "./hooks/useDataRefresh";
import { useAppMonitoring } from "./hooks/useAppMonitoring";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { LoadingState, ErrorState, EmptyState } from "./components/LoadingState";
import { stableToast } from "@/components/ui/stable-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorType } from "./hooks/useBusinessDataFetch";

export default function BusinessOptimizationPage() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [error, setError] = useState<boolean>(false);
  const [forcedExit, setForcedExit] = useState(false);
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
    
    stableToast({
      title: "Data loading error",
      description: "We encountered an issue loading your business analytics data. Using fallback data instead.",
      variant: "destructive"
    });
  }, []);
  
  useAppMonitoring();
  
  const { 
    isLoading, 
    locationLoading, 
    inventoryData, 
    salesData, 
    suppliersData, 
    locationData, 
    pharmacyLocation, 
    refreshData, 
    refreshLocationData,
    connectionError,
    errorType,
    hasError,
    retryFetch
  } = useBusinessData({
    onError: handleDataError,
    maxRetries: 2,
    timeout: 6000
  });
  
  const { isStableLoading } = useLoadingState({
    isLoading, 
    locationLoading,
    forceExitTimeout: 5000,
    stabilityDelay: 100
  });

  useEffect(() => {
    const forceExitTimer = setTimeout(() => {
      if (isStableLoading) {
        console.log("Force exiting loading state after absolute timeout");
        setForcedExit(true);
      }
    }, 10000);
    
    return () => clearTimeout(forceExitTimer);
  }, [isStableLoading]);
  
  const { lastRefreshed, handleRefreshAll, refreshInProgress } = useDataRefresh({
    refreshData,
    refreshLocationData,
    autoRefreshInterval: 10 * 60 * 1000, // 10 minutes auto-refresh
    onError: (refreshError) => {
      console.error("Refresh error:", refreshError);
      setError(true);
    }
  });

  console.log("BusinessOptimizationPage render state:", {
    isLoading,
    locationLoading,
    isStableLoading,
    forcedExit,
    hasData: !!(inventoryData?.length || salesData?.length || suppliersData?.length || 
               (locationData && Object.keys(locationData || {}).length)),
    hasError,
    error,
    refreshInProgress,
    inventoryDataLength: inventoryData?.length || 0,
    salesDataLength: salesData?.length || 0,
    suppliersDataLength: suppliersData?.length || 0,
    locationDataKeys: locationData ? Object.keys(locationData).length : 0
  });

  useEffect(() => {
    const cspRetryTimer = setTimeout(() => {
      if (isStableLoading && !error && !hasError) {
        console.log("Attempting retry due to possible CSP issues");
        retryFetch?.();
      }
    }, 3000);
    
    return () => clearTimeout(cspRetryTimer);
  }, [isStableLoading, error, hasError, retryFetch]);

  if (isStableLoading && !forcedExit) {
    console.log("Rendering stable loading state");
    return (
      <DashboardLayout>
        <div className="transition-opacity duration-300 ease-in-out">
          <LoadingState message="Loading your business analytics data..." />
        </div>
      </DashboardLayout>
    );
  }

  const hasData = (
    (inventoryData && inventoryData.length > 0) || 
    (salesData && salesData.length > 0) || 
    (suppliersData && suppliersData.length > 0) ||
    (locationData && Object.keys(locationData || {}).length > 0)
  );
  
  console.log("Has data:", hasData, "locationData:", locationData);

  if ((error || hasError || forcedExit) && !hasData) {
    console.log("Rendering error state", { error, hasError, errorType, connectionError });
    return (
      <DashboardLayout>
        <div className="transition-opacity duration-300 ease-in-out">
          <ErrorState 
            onRetry={handleRefreshAll} 
            errorType={errorType}
            errorMessage={connectionError || "Loading timed out. Please try again."}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasData && !isLoading && !locationLoading) {
    console.log("Rendering empty state");
    return (
      <DashboardLayout>
        <div className="transition-opacity duration-300 ease-in-out">
          <EmptyState />
        </div>
      </DashboardLayout>
    );
  }

  console.log("Rendering main content");
  return (
    <DashboardLayout>
      <div className="space-y-6 transition-opacity duration-300 ease-in-out">
        <PageHeader 
          pharmacyLocation={pharmacyLocation} 
          onRefresh={handleRefreshAll}
          lastRefreshed={lastRefreshed}
          dataSources={locationData?.dataSources}
          hasError={error || hasError || forcedExit}
          isRefreshing={refreshInProgress?.current}
        />
        
        <Tabs defaultValue="forecast" onValueChange={setActiveTab}>
          <TabsNavigation />
          
          <div className="mt-4">
            {forcedExit && !hasData ? (
              <div className="p-6 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">
                  Partial Data Loaded
                </h3>
                <p className="text-amber-700 dark:text-amber-400 mt-2">
                  Some data couldn't be loaded completely. You're seeing limited information.
                  <button 
                    onClick={handleRefreshAll}
                    className="ml-2 underline text-blue-600 dark:text-blue-400"
                  >
                    Try again
                  </button>
                </p>
              </div>
            ) : (
              <TabContent 
                activeTab={activeTab}
                inventoryData={inventoryData || []}
                salesData={salesData || []}
                suppliersData={suppliersData || []}
                locationData={locationData || {}}
                pharmacyLocation={pharmacyLocation}
                lastRefreshed={lastRefreshed}
              />
            )}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
