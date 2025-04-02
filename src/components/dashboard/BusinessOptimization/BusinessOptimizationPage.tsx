
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
  const { isLoading, businessData, error } = useBusinessData();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    setSearchParams({ tab: tabValue });
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

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Business Optimization" 
        description="Analyze and optimize your pharmacy business performance"
        isLoading={isLoading}
        hasError={!!error}
      />

      <TabsNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      <TabContent>
        {activeTab === "forecast" && <MarketForecastTab />}
        {activeTab === "margin" && <MarginAnalysisTab />}
        {activeTab === "supplier" && <SupplierMetricsTab />}
        {activeTab === "expiry" && <ExpiryAnalysisTab />}
        {activeTab === "seasonal" && <SeasonalTrendsTab />}
        {activeTab === "regional" && <RegionalDemandTab />}
        {activeTab === "returns" && <ReturnAnalysisTab />}
      </TabContent>
    </div>
  );
}
