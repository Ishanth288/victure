
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "./components/PageHeader";
import { TabsNavigation } from "./components/TabsNavigation";
import { TabContent } from "./components/TabContent";
import { MarketForecastTab } from "./MarketForecastTab";
import { MarginAnalysisTab } from "./MarginAnalysisTab";
import { SupplierMetricsTab } from "./SupplierMetricsTab";
import { ExpiryAnalysisTab } from "./ExpiryAnalysisTab";
import { SeasonalTrendsTab } from "./SeasonalTrendsTab";
import { RegionalDemandTab } from "./RegionalDemandTab";
import { ReturnAnalysisTab } from "./ReturnAnalysisTab";
import { useBusinessData } from "./hooks/useBusinessData";

export function BusinessOptimizationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("forecast");
  const [loadingTab, setLoadingTab] = useState<string | null>(null);
  const { 
    isLoading, 
    inventoryData, 
    salesData, 
    suppliersData,
    locationData,
    pharmacyLocation,
    hasError 
  } = useBusinessData();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    setSearchParams({ tab: tabValue });
    // Only set loading when changing tabs
    setLoadingTab(tabValue);
    // Clear loading after a short delay
    setTimeout(() => setLoadingTab(null), 500);
  };

  const tabs = [
    { id: "forecast", label: "Market Forecast" },
    { id: "margin", label: "Margin Analysis" },
    { id: "supplier", label: "Supplier Metrics" },
    { id: "expiry", label: "Expiry Analysis" },
    { id: "seasonal", label: "Seasonal Trends" },
    { id: "regional", label: "Regional Demand" },
    { id: "returns", label: "Return Analysis" }
  ];

  // Mock data for tabs that need it
  const mockForecastData = [];
  const mockMarginData = [];
  const mockExpiryData = [];
  const mockSeasonalTrendsData = [];
  const mockRegionalDemandData = [];

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Business Optimization" 
        description="Analyze and optimize your pharmacy business performance"
        isLoading={isLoading}
        hasError={hasError}
      />

      <TabsNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      <TabContent>
        {activeTab === "forecast" && (
          <MarketForecastTab 
            forecastData={mockForecastData} 
            regionalDemandData={mockRegionalDemandData} 
            seasonalTrendsData={mockSeasonalTrendsData} 
            pharmacyLocation={pharmacyLocation} 
          />
        )}
        {activeTab === "margin" && (
          <MarginAnalysisTab 
            marginData={mockMarginData} 
            locationData={locationData} 
            pharmacyLocation={pharmacyLocation} 
          />
        )}
        {activeTab === "supplier" && (
          <SupplierMetricsTab supplierData={suppliersData || []} />
        )}
        {activeTab === "expiry" && (
          <ExpiryAnalysisTab 
            expiryData={mockExpiryData} 
            inventoryData={inventoryData || []} 
          />
        )}
        {activeTab === "seasonal" && (
          <SeasonalTrendsTab 
            locationData={locationData} 
            pharmacyLocation={pharmacyLocation} 
            seasonalTrendsData={mockSeasonalTrendsData} 
            inventoryData={inventoryData || []} 
          />
        )}
        {activeTab === "regional" && (
          <RegionalDemandTab 
            regionalDemandData={mockRegionalDemandData} 
            pharmacyLocation={pharmacyLocation} 
            locationData={locationData} 
          />
        )}
        {activeTab === "returns" && (
          <ReturnAnalysisTab isLoading={loadingTab === "returns"} />
        )}
      </TabContent>
    </div>
  );
}
