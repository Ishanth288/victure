
import { 
  prepareForecastData, 
  prepareMarginData, 
  prepareSupplierData, 
  prepareExpiryData, 
  prepareSeasonalTrendsData, 
  prepareRegionalDemandData 
} from "../businessOptimizationUtils";

import { MarketForecastTab } from "../MarketForecastTab";
import { MarginAnalysisTab } from "../MarginAnalysisTab";
import { SupplierMetricsTab } from "../SupplierMetricsTab";
import { ExpiryAnalysisTab } from "../ExpiryAnalysisTab";
import { SeasonalTrendsTab } from "../SeasonalTrendsTab";
import { RegionalDemandTab } from "../RegionalDemandTab";

interface TabContentProps {
  activeTab: string;
  inventoryData: any[];
  salesData: any[];
  suppliersData: any[];
  locationData: any;
  pharmacyLocation: any;
}

export function TabContent({ 
  activeTab,
  inventoryData = [],
  salesData = [],
  suppliersData = [],
  locationData = {},
  pharmacyLocation = null
}: TabContentProps) {
  console.log("TabContent rendering", { activeTab });
  
  // Prepare data with null-safety
  const forecastData = prepareForecastData(locationData, salesData);
  const marginData = prepareMarginData(inventoryData);
  const supplierData = prepareSupplierData(suppliersData);
  const expiryData = prepareExpiryData(inventoryData);
  const seasonalTrendsData = prepareSeasonalTrendsData(locationData);
  const regionalDemandData = prepareRegionalDemandData(locationData);

  // Only render the active tab content to improve performance
  switch(activeTab) {
    case "forecast":
      return (
        <MarketForecastTab 
          forecastData={forecastData} 
          regionalDemandData={regionalDemandData} 
          seasonalTrendsData={seasonalTrendsData}
          pharmacyLocation={pharmacyLocation}
        />
      );
    case "margin":
      return (
        <MarginAnalysisTab 
          marginData={marginData} 
          locationData={locationData}
          pharmacyLocation={pharmacyLocation}
        />
      );
    case "supplier":
      return <SupplierMetricsTab supplierData={supplierData} />;
    case "expiry":
      return (
        <ExpiryAnalysisTab 
          expiryData={expiryData} 
          inventoryData={inventoryData} 
        />
      );
    case "seasonal":
      return (
        <SeasonalTrendsTab 
          locationData={locationData}
          pharmacyLocation={pharmacyLocation}
          seasonalTrendsData={seasonalTrendsData}
          inventoryData={inventoryData}
        />
      );
    case "regional":
      return (
        <RegionalDemandTab 
          regionalDemandData={regionalDemandData}
          pharmacyLocation={pharmacyLocation}
          locationData={locationData}
        />
      );
    default:
      return null;
  }
}
