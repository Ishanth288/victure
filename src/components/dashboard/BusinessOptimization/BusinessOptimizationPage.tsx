
import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusinessData } from "./hooks/useBusinessData";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { LoadingState, ErrorState } from "./components/LoadingState";
import { setupPageOptimizations } from "@/utils/performanceUtils";

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
    connectionError 
  } = useBusinessData({
    onError: () => setError(true),
  });

  // Apply performance optimizations
  useEffect(() => {
    const cleanup = setupPageOptimizations();
    return () => cleanup();
  }, []);

  // Check for connection errors
  useEffect(() => {
    if (connectionError) {
      setError(true);
      console.error("Connection error detected:", connectionError);
    }
  }, [connectionError]);

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

  if (error) {
    return (
      <DashboardLayout>
        <ErrorState onRetry={handleRefreshAll} />
      </DashboardLayout>
    );
  }

  if (isLoading || locationLoading) {
    return (
      <DashboardLayout>
        <LoadingState />
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
