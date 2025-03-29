
import { useState, useCallback } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { useRefactoredBusinessData } from "./hooks/useRefactoredBusinessData";
import { useLoadingState } from "./hooks/useLoadingState";
import { useDataRefresh } from "./hooks/useDataRefresh";
import { useAppMonitoring } from "./hooks/useAppMonitoring";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { LoadingState, ErrorState, EmptyState } from "./components/LoadingState";

export default function BusinessOptimizationPage() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [error, setError] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
  }, []);
  
  // Initialize app monitoring and performance optimizations
  useAppMonitoring();
  
  // Business data hook
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
  } = useRefactoredBusinessData({
    onError: handleDataError,
  });
  
  // Stable loading state to prevent flickering
  const { isStableLoading } = useLoadingState({
    isLoading, 
    locationLoading
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
  
  console.log("Has data:", hasData);

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

  // Render empty state if no data is available
  if (!hasData) {
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
