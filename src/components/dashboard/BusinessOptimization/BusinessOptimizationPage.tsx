
import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { useBusinessData } from "./hooks/useBusinessData";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { LoadingState } from "./components/LoadingState";
import { setupPageOptimizations } from "@/utils/performanceUtils";

export default function BusinessOptimizationPage() {
  const [activeTab, setActiveTab] = useState("forecast");
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
    refreshLocationData 
  } = useBusinessData();

  // Apply performance optimizations
  useEffect(() => {
    const cleanup = setupPageOptimizations();
    return () => cleanup();
  }, []);

  // Handle refresh of all data
  const handleRefreshAll = () => {
    refreshData();
    refreshLocationData();
    toast({
      title: "Refreshing all data",
      description: "Updating analytics with the latest information...",
      duration: 3000
    });
  };

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
