
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
  console.log("TabContent rendering", { 
    activeTab,
    hasInventoryData: Array.isArray(inventoryData) && inventoryData.length > 0,
    hasSalesData: Array.isArray(salesData) && salesData.length > 0,
    hasSuppliersData: Array.isArray(suppliersData) && suppliersData.length > 0,
    hasLocationData: locationData && Object.keys(locationData).length > 0
  });
  
  // Ensure all inputs are valid before processing
  const safeInventoryData = Array.isArray(inventoryData) ? inventoryData : [];
  const safeSalesData = Array.isArray(salesData) ? salesData : [];
  const safeSuppliersData = Array.isArray(suppliersData) ? suppliersData : [];
  const safeLocationData = locationData || {};
  
  // Prepare data with null-safety
  const forecastData = prepareForecastData(safeLocationData, safeSalesData);
  const marginData = prepareMarginData(safeInventoryData);
  const supplierData = prepareSupplierData(safeSuppliersData);
  const expiryData = prepareExpiryData(safeInventoryData);
  const seasonalTrendsData = prepareSeasonalTrendsData(safeLocationData);
  const regionalDemandData = prepareRegionalDemandData(safeLocationData);

  console.log("TabContent data prepared", {
    forecastDataLength: forecastData?.length || 0,
    marginDataLength: marginData?.length || 0,
    supplierDataLength: supplierData?.length || 0,
    expiryDataLength: expiryData?.length || 0,
    seasonalTrendsDataLength: seasonalTrendsData?.length || 0,
    regionalDemandDataLength: regionalDemandData?.length || 0
  });

  // Only render the active tab content to improve performance
  switch(activeTab) {
    case "forecast":
      return (
        <MarketForecastTab 
          forecastData={forecastData || []} 
          regionalDemandData={regionalDemandData || []} 
          seasonalTrendsData={seasonalTrendsData || []}
          pharmacyLocation={pharmacyLocation}
        />
      );
    case "margin":
      return (
        <MarginAnalysisTab 
          marginData={marginData || []} 
          locationData={safeLocationData}
          pharmacyLocation={pharmacyLocation}
        />
      );
    case "supplier":
      return <SupplierMetricsTab supplierData={supplierData || []} />;
    case "expiry":
      return (
        <ExpiryAnalysisTab 
          expiryData={expiryData || []} 
          inventoryData={safeInventoryData} 
        />
      );
    case "seasonal":
      return (
        <SeasonalTrendsTab 
          locationData={safeLocationData}
          pharmacyLocation={pharmacyLocation}
          seasonalTrendsData={seasonalTrendsData || []}
          inventoryData={safeInventoryData}
        />
      );
    case "regional":
      return (
        <RegionalDemandTab 
          regionalDemandData={regionalDemandData || []}
          pharmacyLocation={pharmacyLocation}
          locationData={safeLocationData}
        />
      );
    default:
      return null;
  }
}
