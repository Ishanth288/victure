
import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, TrendingUp, BarChart2, PieChartIcon, Activity, 
  RefreshCw, MapPin, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import DashboardLayout from "@/components/DashboardLayout";
import { MarketForecastTab } from "./MarketForecastTab";
import { MarginAnalysisTab } from "./MarginAnalysisTab";
import { SupplierMetricsTab } from "./SupplierMetricsTab";
import { ExpiryAnalysisTab } from "./ExpiryAnalysisTab";
import { SeasonalTrendsTab } from "./SeasonalTrendsTab";
import { RegionalDemandTab } from "./RegionalDemandTab";
import { 
  prepareForecastData, 
  prepareMarginData, 
  prepareSupplierData, 
  prepareExpiryData, 
  prepareSeasonalTrendsData, 
  prepareRegionalDemandData 
} from "./businessOptimizationUtils";

export default function BusinessOptimizationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const { toast } = useToast();
  const { locationData, pharmacyLocation, refreshData: refreshLocationData, isLoading: locationLoading } = useLocationBasedAnalytics();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch inventory data
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      // Fetch sales data from bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*, bill_items(*)')
        .eq('user_id', user.id);

      if (billsError) throw billsError;

      // Fetch supplier data from purchase orders
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .eq('user_id', user.id);

      if (poError) throw poError;

      if (inventoryItems) {
        setInventoryData(inventoryItems);
      }

      if (bills) {
        setSalesData(bills);
      }

      if (purchaseOrders) {
        setSuppliersData(purchaseOrders);
      }
      
      toast({
        title: "Data refreshed",
        description: "Business optimization data has been updated.",
        duration: 3000
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "There was a problem loading your business data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Create a channel for inventory updates
      const inventoryChannel = supabase
        .channel('business-data-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${user.id}` }, 
          () => {
            console.log('Inventory data changed, refreshing...');
            fetchData();
          }
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, 
          () => {
            console.log('Bills data changed, refreshing...');
            fetchData();
          }
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'purchase_orders', filter: `user_id=eq.${user.id}` }, 
          () => {
            console.log('Purchase orders data changed, refreshing...');
            fetchData();
          }
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
          () => {
            console.log('Profile data changed, refreshing location data...');
            refreshLocationData();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(inventoryChannel);
      };
    };
    
    const cleanup = setupSubscriptions();
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, [fetchData, refreshLocationData]);

  // Prepare data
  const forecastData = prepareForecastData(locationData, salesData);
  const marginData = prepareMarginData(inventoryData);
  const supplierData = prepareSupplierData(suppliersData);
  const expiryData = prepareExpiryData(inventoryData);
  const seasonalTrendsData = prepareSeasonalTrendsData(locationData);
  const regionalDemandData = prepareRegionalDemandData(locationData);

  // Handle refresh of all data
  const handleRefreshAll = () => {
    fetchData();
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
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading business optimization data...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Business Optimization</h1>
            {pharmacyLocation && (
              <div className="flex items-center mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4 mr-1" />
                <span>
                  {pharmacyLocation.city}, {pharmacyLocation.state} - Location-based analytics enabled
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleRefreshAll}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh All Data
            </button>
          </div>
        </div>
        
        <Tabs defaultValue="forecast">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
            <TabsTrigger value="forecast" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Market Forecast
            </TabsTrigger>
            <TabsTrigger value="margin" className="flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Margin Analysis
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2" />
              Supplier Metrics
            </TabsTrigger>
            <TabsTrigger value="expiry" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Expiry Analysis
            </TabsTrigger>
            <TabsTrigger value="seasonal" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Seasonal Trends
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Regional Demand
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="forecast">
            <MarketForecastTab 
              forecastData={forecastData} 
              regionalDemandData={regionalDemandData} 
              seasonalTrendsData={seasonalTrendsData}
              pharmacyLocation={pharmacyLocation}
            />
          </TabsContent>
          
          <TabsContent value="margin">
            <MarginAnalysisTab 
              marginData={marginData} 
              locationData={locationData}
              pharmacyLocation={pharmacyLocation}
            />
          </TabsContent>
          
          <TabsContent value="supplier">
            <SupplierMetricsTab supplierData={supplierData} />
          </TabsContent>
          
          <TabsContent value="expiry">
            <ExpiryAnalysisTab 
              expiryData={expiryData} 
              inventoryData={inventoryData} 
            />
          </TabsContent>
          
          <TabsContent value="seasonal">
            <SeasonalTrendsTab 
              locationData={locationData}
              pharmacyLocation={pharmacyLocation}
              seasonalTrendsData={seasonalTrendsData}
              inventoryData={inventoryData}
            />
          </TabsContent>
          
          <TabsContent value="regional">
            <RegionalDemandTab 
              regionalDemandData={regionalDemandData}
              pharmacyLocation={pharmacyLocation}
              locationData={locationData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
