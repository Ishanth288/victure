
import { useState, useEffect } from "react";
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
  const { toast } = useToast();
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
    onError: () => setError(true),
  });

  // Initialize app monitoring on first load
  useEffect(() => {
    initializeAppMonitoring();
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    const cleanup = setupPageOptimizations();
    return () => cleanup();
  }, []);

  // Handle refresh of all data
  const handleRefreshAll = () => {
    setError(false);
    refreshData();
    refreshLocationData();
    toast({
      title: "Refreshing all data",
      description: "Updating analytics with the latest information...",
      duration: 3000
    });
  };

  // Render loading state
  if (isLoading || locationLoading) {
    return (
      <DashboardLayout>
        <LoadingState message="Loading your business analytics data..." />
      </DashboardLayout>
    );
  }

  // Render error state
  if (error || hasError) {
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
    (locationData && Object.keys(locationData).length > 0)
  );

  // Render empty state if no data is available
  if (!hasData) {
    return (
      <DashboardLayout>
        <EmptyState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader 
          pharmacyLocation={pharmacyLocation} 
          onRefresh={handleRefreshAll} 
        />
        
        <Tabs defaultValue="forecast" onValueChange={setActiveTab}>
          <TabsNavigation />
          
          <div className="mt-4">
            <TabContent 
              activeTab={activeTab}
              inventoryData={inventoryData}
              salesData={salesData}
              suppliersData={suppliersData}
              locationData={locationData}
              pharmacyLocation={pharmacyLocation}
            />
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
