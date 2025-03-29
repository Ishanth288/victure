
import { useState, useCallback } from "react";
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

export default function BusinessOptimizationPage() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [error, setError] = useState<boolean>(false);
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
    
    // Use stableToast to display error with 4 second timeout
    stableToast({
      title: "Data loading error",
      description: "We encountered an issue loading your business analytics data. Using fallback data instead.",
      variant: "destructive"
    });
  }, []);
  
  // Initialize app monitoring and performance optimizations
  useAppMonitoring();
  
  // Business data hook with improved error handling
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
    hasError
  } = useBusinessData({
    onError: handleDataError,
    maxRetries: 5, // Increase retries
    timeout: 10000 // Increase timeout
  });
  
  // Stable loading state to prevent flickering
  const { isStableLoading } = useLoadingState({
    isLoading, 
    locationLoading,
    forceExitTimeout: 5000, // Reduce timeout to ensure it exits loading state
    stabilityDelay: 200 // Lower stability delay for quicker transitions
  });
  
  // Data refresh handler
  const { lastRefreshed, handleRefreshAll } = useDataRefresh({
    refreshData,
    refreshLocationData
  });

  // Render loading state with stability to prevent flickering
  if (isStableLoading) {
    console.log("Rendering stable loading state");
    return (
      <DashboardLayout>
        <div className="transition-opacity duration-300 ease-in-out">
          <LoadingState message="Loading your business analytics data from Google Trends and News..." />
        </div>
      </DashboardLayout>
    );
  }

  // Check if we have data - important: always prioritize showing data over error state
  const hasData = (
    (inventoryData && inventoryData.length > 0) || 
    (salesData && salesData.length > 0) || 
    (suppliersData && suppliersData.length > 0) ||
    (locationData && Object.keys(locationData || {}).length > 0)
  );
  
  console.log("Has data:", hasData, "locationData:", locationData);

  // Only show error state if we have no data at all
  if ((error || hasError) && !hasData) {
    console.log("Rendering error state", { error, hasError, errorType, connectionError });
    return (
      <DashboardLayout>
        <div className="transition-opacity duration-300 ease-in-out">
          <ErrorState 
            onRetry={handleRefreshAll} 
            errorType={errorType}
            errorMessage={connectionError || undefined}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Ensure we fallback to showing empty state if no data available
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
          hasError={error || hasError}
        />
        
        <Tabs defaultValue="forecast" onValueChange={setActiveTab}>
          <TabsNavigation />
          
          <div className="mt-4">
            <TabContent 
              activeTab={activeTab}
              inventoryData={inventoryData || []}
              salesData={salesData || []}
              suppliersData={suppliersData || []}
              locationData={locationData || {}}
              pharmacyLocation={pharmacyLocation}
              lastRefreshed={lastRefreshed}
            />
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
