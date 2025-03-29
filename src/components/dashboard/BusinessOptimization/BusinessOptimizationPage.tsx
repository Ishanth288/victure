
import { useState, useEffect, useRef } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusinessData } from "./hooks/useBusinessData";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { LoadingState, ErrorState, EmptyState } from "./components/LoadingState";
import { setupPageOptimizations } from "@/utils/performanceUtils";
import { initializeAppMonitoring } from "@/utils/supabaseMonitoring";

export default function BusinessOptimizationPage() {
  const [activeTab, setActiveTab] = useState("forecast");
  const [error, setError] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();
  const renderAttempts = useRef(0);
  const maxRenderAttempts = 5;
  
  // Add console logs to debug the component lifecycle
  console.log("Business Optimization Page rendering - attempt:", renderAttempts.current);
  renderAttempts.current += 1;
  
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
    autoRefreshEnabled
  } = useBusinessData({
    onError: () => {
      console.log("Business data error callback triggered");
      setError(true);
    },
  });
  
  console.log("Data loading state:", { 
    isLoading, 
    locationLoading, 
    hasError, 
    error, 
    renderAttempts: renderAttempts.current,
    lastRefreshed: lastRefreshed.toLocaleString() 
  });
  
  console.log("Data availability:", { 
    inventoryData: inventoryData?.length || 0,
    salesData: salesData?.length || 0,
    suppliersData: suppliersData?.length || 0,
    locationData: locationData ? 'yes' : 'no'
  });

  // Force an exit from loading state if we've tried too many times
  useEffect(() => {
    if ((isLoading || locationLoading) && renderAttempts.current > maxRenderAttempts) {
      console.log("Forcing exit from loading state after multiple attempts");
      // This is a fallback to prevent infinite loading
      if (inventoryData?.length || salesData?.length || suppliersData?.length || locationData) {
        // We have some data, so let's show what we have
        toast({
          title: "Partial data loaded",
          description: "Some data might be missing. Please refresh to try again.",
          duration: 5000
        });
      } else {
        // No data available, show error
        setError(true);
        toast({
          title: "Data loading error",
          description: "Failed to load business optimization data after multiple attempts.",
          variant: "destructive"
        });
      }
    }
  }, [isLoading, locationLoading, renderAttempts, inventoryData, salesData, suppliersData, locationData, toast]);

  // Initialize app monitoring on first load
  useEffect(() => {
    console.log("Initializing app monitoring");
    initializeAppMonitoring();
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    console.log("Setting up page optimizations");
    const cleanup = setupPageOptimizations();
    return () => cleanup();
  }, []);

  // Handle refresh of all data
  const handleRefreshAll = () => {
    console.log("Manual refresh triggered");
    setError(false);
    refreshData();
    refreshLocationData();
    setLastRefreshed(new Date());
    renderAttempts.current = 0;
    toast({
      title: "Refreshing all data",
      description: "Updating analytics with the latest information...",
      duration: 3000
    });
  };

  // Render loading state
  if ((isLoading || locationLoading) && renderAttempts.current <= maxRenderAttempts) {
    console.log("Rendering loading state");
    return (
      <DashboardLayout>
        <LoadingState message="Loading your business analytics data..." />
      </DashboardLayout>
    );
  }

  // Render error state
  if (error || hasError) {
    console.log("Rendering error state", { error, hasError, errorType, connectionError });
    return (
      <DashboardLayout>
        <ErrorState 
          onRetry={handleRefreshAll} 
          errorType={errorType}
          errorMessage={connectionError || undefined}
        />
      </DashboardLayout>
    );
  }

  // Check if we have data
  const hasData = (
    (inventoryData && inventoryData.length > 0) || 
    (salesData && salesData.length > 0) || 
    (suppliersData && suppliersData.length > 0) ||
    (locationData && Object.keys(locationData || {}).length > 0)
  );
  
  console.log("Has data:", hasData);

  // Render empty state if no data is available
  if (!hasData) {
    console.log("Rendering empty state");
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  console.log("Rendering main content");
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          pharmacyLocation={pharmacyLocation} 
          onRefresh={handleRefreshAll}
          lastRefreshed={lastRefreshed} 
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
