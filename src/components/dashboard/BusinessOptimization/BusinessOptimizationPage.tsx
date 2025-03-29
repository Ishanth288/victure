
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [isStableLoading, setIsStableLoading] = useState(true);
  const { toast } = useToast();
  const renderAttempts = useRef(0);
  const maxRenderAttempts = 3;
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
  }, []);
  
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
    onError: handleDataError,
  });
  
  // Add stability to the loading state to prevent flickering
  useEffect(() => {
    // When loading starts, set isStableLoading to true immediately
    if (isLoading || locationLoading) {
      setIsStableLoading(true);
      
      // Clear any existing timers
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      
      // Set a timeout to force exit loading state after a maximum time
      // This prevents infinite loading
      loadingTimerRef.current = setTimeout(() => {
        setIsStableLoading(false);
      }, 5000); // Max 5 seconds of loading before forcing exit
    } 
    // When loading ends, wait a bit before showing content to prevent flickering
    else if (isStableLoading) {
      // Clear force exit timer if it exists
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      stabilityTimerRef.current = setTimeout(() => {
        setIsStableLoading(false);
      }, 300); // 300ms delay before transitioning from loading to content
    }

    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [isLoading, locationLoading, isStableLoading]);

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

  // Increment render attempts only once
  useEffect(() => {
    renderAttempts.current += 1;
    console.log("Business Optimization Page rendering - attempt:", renderAttempts.current);
  }, []); // Empty dependency array ensures this only runs once

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
      description: "Updating analytics with Google Trends and news data...",
      duration: 3000
    });
  };

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
