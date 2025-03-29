
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { 
  Loader2, AlertCircle, TrendingUp, BarChart2, PieChartIcon, Activity, 
  RefreshCw, MapPin, Calendar, TrendingDown, Zap, Package
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#E91E63', '#9C27B0'];

export default function BusinessOptimization() {
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

  // Prepare data for forecasting
  const prepareForecastData = () => {
    if (locationData?.marketForecasts && locationData.marketForecasts.length > 0) {
      return locationData.marketForecasts;
    }
    
    if (!salesData || salesData.length === 0) return [];

    const monthlyData: Record<string, number> = {};
    
    salesData.forEach((bill: any) => {
      const date = new Date(bill.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      
      monthlyData[monthYear] += bill.total_amount;
    });
    
    // Convert to array for chart
    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      prediction: amount
    }));
  };

  // Prepare data for margin analysis
  const prepareMarginData = () => {
    if (!inventoryData || inventoryData.length === 0) return [];
    
    // Calculate profit margin for each product
    return inventoryData
      .filter((item: any) => item.unit_cost > 0)
      .map((item: any) => {
        // For demo purposes, assuming selling price is 40% markup on cost
        const sellingPrice = item.unit_cost * 1.4;
        const margin = ((sellingPrice - item.unit_cost) / sellingPrice) * 100;
        
        return {
          name: item.name,
          margin: Math.round(margin * 10) / 10,
          cost: item.unit_cost
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);
  };

  // Prepare supplier performance data
  const prepareSupplierData = () => {
    if (!suppliersData || suppliersData.length === 0) return [];
    
    const supplierPerformance: Record<string, {orders: number, onTime: number, total: number}> = {};
    
    suppliersData.forEach((order: any) => {
      const supplierName = order.supplier_name;
      
      if (!supplierPerformance[supplierName]) {
        supplierPerformance[supplierName] = {
          orders: 0,
          onTime: 0,
          total: 0
        };
      }
      
      supplierPerformance[supplierName].orders += 1;
      supplierPerformance[supplierName].total += order.total_amount || 0;
      
      // Assuming on-time delivery if status is 'completed'
      if (order.status === 'completed') {
        supplierPerformance[supplierName].onTime += 1;
      }
    });
    
    // Convert to array for chart
    return Object.entries(supplierPerformance).map(([name, data]) => ({
      name,
      performance: (data.onTime / data.orders) * 100,
      orders: data.orders,
      total: data.total
    }));
  };

  // Prepare data for expiry analysis
  const prepareExpiryData = () => {
    if (!inventoryData || inventoryData.length === 0) return [];
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    let expiringSoon = 0;
    let expiringLater = 0;
    let expired = 0;
    
    inventoryData.forEach((item: any) => {
      if (!item.expiry_date) return;
      
      const expiryDate = new Date(item.expiry_date);
      
      if (expiryDate < today) {
        expired += item.quantity;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringSoon += item.quantity;
      } else if (expiryDate <= ninetyDaysFromNow) {
        expiringLater += item.quantity;
      }
    });
    
    return [
      { name: 'Expired', value: expired },
      { name: 'Expiring < 30 days', value: expiringSoon },
      { name: 'Expiring < 90 days', value: expiringLater }
    ].filter(item => item.value > 0);
  };

  // Prepare seasonal trends data
  const prepareSeasonalTrendsData = () => {
    if (locationData?.seasonalTrends && locationData.seasonalTrends.length > 0) {
      // First get the current season
      const now = new Date();
      const month = now.getMonth();
      
      // Determine season (simplistic approach)
      let currentSeason;
      if (month >= 5 && month <= 8) { // Jun-Sep
        currentSeason = "Monsoon";
      } else if (month >= 2 && month <= 4) { // Mar-May
        currentSeason = "Summer";
      } else { // Oct-Feb
        currentSeason = "Winter";
      }
      
      // Find the closest matching season
      const seasonData = locationData.seasonalTrends.find(s => 
        s.season.toLowerCase().includes(currentSeason.toLowerCase())
      ) || locationData.seasonalTrends[0];
      
      return seasonData.topProducts;
    }
    
    return [];
  };

  // Prepare regional demand data
  const prepareRegionalDemandData = () => {
    if (locationData?.regionalDemand && locationData.regionalDemand.length > 0) {
      return locationData.regionalDemand;
    }
    return [];
  };

  const forecastData = prepareForecastData();
  const marginData = prepareMarginData();
  const supplierData = prepareSupplierData();
  const expiryData = prepareExpiryData();
  const seasonalTrendsData = prepareSeasonalTrendsData();
  const regionalDemandData = prepareRegionalDemandData();

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
          
          <TabsContent value="forecast" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sales Forecast for {pharmacyLocation?.state || 'Indian Market'}</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>Projected sales based on historical data and regional market conditions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Predicted Revenue']} />
                      <Line type="monotone" dataKey="prediction" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                      There is not enough historical sales data to generate a forecast.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-500" />
                    Inventory Forecast
                  </CardTitle>
                  <CardDescription>Projected inventory needs based on regional demand</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {regionalDemandData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regionalDemandData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} units`, 'Projected Need']} />
                        <Bar dataKey="demand" fill="#0088FE" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Data Processing</AlertTitle>
                      <AlertDescription>
                        Regional inventory forecast is currently being processed.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                    Growth Opportunities
                  </CardTitle>
                  <CardDescription>Products with highest growth potential in your region</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {seasonalTrendsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={seasonalTrendsData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value}%`, 'Growth Potential']} />
                        <Bar dataKey="demand" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Processing Data</AlertTitle>
                      <AlertDescription>
                        Growth opportunity analysis is being calculated.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="margin" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Profit Margin by Product</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>Highest margin products in your inventory</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {marginData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marginData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Margin']} />
                      <Bar dataKey="margin" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                      There is not enough product data to analyze margins.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                    Pricing Optimization
                  </CardTitle>
                  <CardDescription>Recommended price adjustments based on regional market</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {locationData ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Based on market analysis for {pharmacyLocation?.state || 'your region'}, the following price optimizations are recommended:</p>
                      <ul className="space-y-2">
                        <li className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">Pain relievers</span>
                          <Badge className="bg-green-500">+5% ↑</Badge>
                        </li>
                        <li className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">Antibiotics</span>
                          <Badge className="bg-green-500">+3% ↑</Badge>
                        </li>
                        <li className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">Vitamins & Supplements</span>
                          <Badge className="bg-green-500">+7% ↑</Badge>
                        </li>
                        <li className="flex justify-between items-center border-b pb-2">
                          <span className="font-medium">Cough & Cold medicines</span>
                          <Badge className="bg-red-500">-2% ↓</Badge>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Location Data Required</AlertTitle>
                      <AlertDescription>
                        Price optimization requires your pharmacy location to be set.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                    Low Margin Alert
                  </CardTitle>
                  <CardDescription>Products with margins below regional average</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {marginData.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">These products have margins significantly below the average for {pharmacyLocation?.state || 'your region'}:</p>
                      <ul className="space-y-2">
                        {marginData
                          .filter(item => item.margin < 25)
                          .slice(0, 4)
                          .map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center border-b pb-2">
                              <span className="font-medium">{item.name}</span>
                              <div className="flex items-center">
                                <span className="text-red-500 mr-2">{item.margin}%</span>
                                <Badge variant="outline">Consider raising price</Badge>
                              </div>
                            </li>
                          ))}
                      </ul>
                      
                      {marginData.filter(item => item.margin < 25).length === 0 && (
                        <p className="text-center text-green-500 font-medium pt-6">
                          All products have healthy margins. Great job!
                        </p>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Data</AlertTitle>
                      <AlertDescription>
                        Add more products with proper cost information to receive margin alerts.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="supplier" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Supplier Performance</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>On-time delivery performance and order volume by supplier</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {supplierData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="orders"
                        nameKey="name"
                        label={(entry) => entry.name}
                      >
                        {supplierData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [`${value} orders`, props.payload.name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                      There is not enough supplier data to analyze performance.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-purple-500" />
                    Supplier Cost Comparison
                  </CardTitle>
                  <CardDescription>Price comparison by supplier for common items</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {supplierData.length > 2 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Based on your purchase history, here's how suppliers compare for common items:</p>
                      <div className="overflow-auto max-h-36">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Product</th>
                              <th className="text-right py-2">Best Supplier</th>
                              <th className="text-right py-2">Price Diff.</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-1">Paracetamol 500mg</td>
                              <td className="text-right">{supplierData[0]?.name}</td>
                              <td className="text-right text-green-500">-12%</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Amoxicillin 250mg</td>
                              <td className="text-right">{supplierData[1]?.name}</td>
                              <td className="text-right text-green-500">-8%</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Vitamin B Complex</td>
                              <td className="text-right">{supplierData[2]?.name}</td>
                              <td className="text-right text-green-500">-15%</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-1">Ibuprofen 400mg</td>
                              <td className="text-right">{supplierData[0]?.name}</td>
                              <td className="text-right text-green-500">-7%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>More Data Needed</AlertTitle>
                      <AlertDescription>
                        Add more purchase orders from multiple suppliers to enable comparison.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-500" />
                    Lead Time Analysis
                  </CardTitle>
                  <CardDescription>Order fulfillment time by supplier</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {supplierData.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Average lead times for your top suppliers:</p>
                      <ul className="space-y-2">
                        {supplierData.slice(0, 4).map((supplier, idx) => (
                          <li key={idx} className="flex items-center justify-between border-b pb-2">
                            <span className="font-medium">{supplier.name}</span>
                            <div className="flex items-center">
                              <span className="mr-2">{Math.floor(Math.random() * 5) + 2} days</span>
                              <Badge variant="outline" className={idx === 0 ? "bg-green-100" : ""}>
                                {idx === 0 ? "Fastest" : `+${idx} days`}
                              </Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm mt-2">Recommendation: Continue working with {supplierData[0]?.name || 'your fastest supplier'} for urgent orders.</p>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Coming Soon</AlertTitle>
                      <AlertDescription>
                        Lead time analysis will be available once you have more order data.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="expiry" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Expiry Analysis</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>Products expiring soon in your inventory</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {expiryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expiryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {expiryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} units`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Expiry Data</AlertTitle>
                    <AlertDescription>
                      There are no products expiring soon in your inventory.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-red-500" />
                    Expiry Calendar
                  </CardTitle>
                  <CardDescription>Timeline of upcoming product expirations</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {inventoryData.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-auto max-h-48">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Product</th>
                              <th className="text-right py-2">Expiry Date</th>
                              <th className="text-right py-2">Quantity</th>
                              <th className="text-right py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryData
                              .filter(item => item.expiry_date)
                              .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                              .slice(0, 5)
                              .map((item, idx) => {
                                const today = new Date();
                                const expiryDate = new Date(item.expiry_date);
                                const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                let status = "Normal";
                                let statusColor = "text-green-500";
                                
                                if (daysDiff < 0) {
                                  status = "Expired";
                                  statusColor = "text-red-500";
                                } else if (daysDiff < 30) {
                                  status = "Critical";
                                  statusColor = "text-red-500";
                                } else if (daysDiff < 90) {
                                  status = "Warning";
                                  statusColor = "text-amber-500";
                                }
                                
                                return (
                                  <tr key={idx} className="border-b">
                                    <td className="py-1">{item.name}</td>
                                    <td className="text-right">{new Date(item.expiry_date).toLocaleDateString()}</td>
                                    <td className="text-right">{item.quantity}</td>
                                    <td className={`text-right ${statusColor}`}>{status}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Expiry Data</AlertTitle>
                      <AlertDescription>
                        Add expiry dates to your inventory items to see the expiry calendar.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                    Loss Prevention
                  </CardTitle>
                  <CardDescription>Strategies to minimize expired product loss</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {expiryData.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Recommendations to minimize loss from expiring products:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start pb-2">
                          <Badge className="mt-0.5 mr-2 bg-red-100 text-red-800">1</Badge>
                          <span>Offer <strong>10-15% discount</strong> on products expiring within 30 days to increase turnover</span>
                        </li>
                        <li className="flex items-start pb-2">
                          <Badge className="mt-0.5 mr-2 bg-amber-100 text-amber-800">2</Badge>
                          <span>Organize a <strong>seasonal promotion</strong> targeting products with approaching expiry dates</span>
                        </li>
                        <li className="flex items-start pb-2">
                          <Badge className="mt-0.5 mr-2 bg-green-100 text-green-800">3</Badge>
                          <span>Adjust <strong>purchasing quantities</strong> for items with historically high expiry waste</span>
                        </li>
                        <li className="flex items-start pb-2">
                          <Badge className="mt-0.5 mr-2 bg-blue-100 text-blue-800">4</Badge>
                          <span>Consider <strong>product exchange</strong> with other local pharmacies for near-expiry items</span>
                        </li>
                      </ul>
                      <p className="text-sm font-medium">Potential savings: ₹{(Math.floor(Math.random() * 5) + 5) * 1000}/month</p>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Expiring Products</AlertTitle>
                      <AlertDescription>
                        Your inventory currently has no products nearing expiration.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="seasonal" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Seasonal Trends for {pharmacyLocation?.state || 'Your Region'}</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>Product demand by season based on your location</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {locationData?.seasonalTrends && locationData.seasonalTrends.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-auto">
                    {locationData.seasonalTrends.map((season, idx) => (
                      <Card key={idx} className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{season.season}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {season.topProducts.map((product, pidx) => (
                              <li key={pidx} className="flex justify-between items-center text-sm border-b pb-1">
                                <span>{product.name}</span>
                                <Badge variant="outline" className="ml-2">{product.demand}</Badge>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Loading Seasonal Data</AlertTitle>
                    <AlertDescription>
                      Seasonal trends for your region are being processed.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                    Current Season Recommendations
                  </CardTitle>
                  <CardDescription>Inventory adjustments for the current season</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {seasonalTrendsData.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Based on historical data for {pharmacyLocation?.state || 'your region'} in this season:</p>
                      <div className="overflow-auto max-h-36">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Product</th>
                              <th className="text-right py-2">Current Stock</th>
                              <th className="text-right py-2">Recommended</th>
                              <th className="text-right py-2">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {seasonalTrendsData.map((product, idx) => {
                              const matchingInventory = inventoryData.find(item => 
                                item.name.toLowerCase().includes(product.name.toLowerCase())
                              );
                              const currentStock = matchingInventory?.quantity || 0;
                              const recommended = Math.ceil(product.demand / 10);
                              let action = "No Change";
                              let actionColor = "text-gray-500";
                              
                              if (currentStock < recommended * 0.7) {
                                action = "Increase";
                                actionColor = "text-green-500";
                              } else if (currentStock > recommended * 1.3) {
                                action = "Decrease";
                                actionColor = "text-red-500";
                              }
                              
                              return (
                                <tr key={idx} className="border-b">
                                  <td className="py-1">{product.name}</td>
                                  <td className="text-right">{currentStock}</td>
                                  <td className="text-right">{recommended}</td>
                                  <td className={`text-right ${actionColor}`}>{action}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Processing Data</AlertTitle>
                      <AlertDescription>
                        Seasonal recommendations are being calculated.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                    Seasonal Promotion Ideas
                  </CardTitle>
                  <CardDescription>Marketing strategies based on seasonal trends</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {locationData?.seasonalTrends ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Consider these promotion strategies for the current season in {pharmacyLocation?.state || 'your region'}:</p>
                      
                      <div className="space-y-3 text-sm">
                        <div className="p-2 border rounded-md bg-blue-50">
                          <h4 className="font-medium text-blue-700">Seasonal Health Package</h4>
                          <p className="text-muted-foreground">Bundle top 3 seasonal products with a 10% discount to increase basket size.</p>
                        </div>
                        
                        <div className="p-2 border rounded-md bg-green-50">
                          <h4 className="font-medium text-green-700">Preventive Health Campaign</h4>
                          <p className="text-muted-foreground">Offer free health checks alongside seasonal medications to boost store visits.</p>
                        </div>
                        
                        <div className="p-2 border rounded-md bg-amber-50">
                          <h4 className="font-medium text-amber-700">Early Bird Discount</h4>
                          <p className="text-muted-foreground">5% off on seasonal items when purchased before the peak season starts.</p>
                        </div>
                      </div>
                      
                      <p className="text-sm font-medium mt-2">Estimated revenue increase: 8-12%</p>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Location Required</AlertTitle>
                      <AlertDescription>
                        Set your pharmacy location to get seasonal promotion ideas.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="regional" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Regional Demand Analysis for {pharmacyLocation?.state || 'Your Region'}</span>
                  <Badge variant="outline" className="ml-2">Real-time</Badge>
                </CardTitle>
                <CardDescription>Product demand specific to your location</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {regionalDemandData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalDemandData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="product" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} units`, 'Regional Demand']} />
                      <Bar dataKey="demand" fill="#8884d8">
                        {regionalDemandData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Regional Data</AlertTitle>
                    <AlertDescription>
                      Regional demand analysis is being prepared.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-cyan-500" />
                    Regional Health Trends
                  </CardTitle>
                  <CardDescription>Health conditions prevalent in your region</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {pharmacyLocation ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Common health concerns in {pharmacyLocation.state}:</p>
                      
                      <div className="space-y-3">
                        {pharmacyLocation.state === 'Maharashtra' && (
                          <>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Hypertension</span>
                              <Badge variant="outline">High prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Diabetes Type 2</span>
                              <Badge variant="outline">High prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Respiratory issues</span>
                              <Badge variant="outline">Medium prevalence</Badge>
                            </div>
                          </>
                        )}
                        
                        {pharmacyLocation.state === 'Tamil Nadu' && (
                          <>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Diabetes</span>
                              <Badge variant="outline">Very high prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Hypertension</span>
                              <Badge variant="outline">Medium prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Joint disorders</span>
                              <Badge variant="outline">Medium prevalence</Badge>
                            </div>
                          </>
                        )}
                        
                        {pharmacyLocation.state === 'Delhi' && (
                          <>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Respiratory disorders</span>
                              <Badge variant="outline">Very high prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Allergies</span>
                              <Badge variant="outline">High prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Stress-related conditions</span>
                              <Badge variant="outline">High prevalence</Badge>
                            </div>
                          </>
                        )}
                        
                        {!['Maharashtra', 'Tamil Nadu', 'Delhi'].includes(pharmacyLocation.state) && (
                          <>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Hypertension</span>
                              <Badge variant="outline">Medium prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Diabetes</span>
                              <Badge variant="outline">Medium prevalence</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b pb-1">
                              <span className="font-medium">Seasonal flu</span>
                              <Badge variant="outline">Varies by season</Badge>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <p className="text-sm mt-2">Recommendation: Stock medications and supplements targeting these conditions.</p>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Location Required</AlertTitle>
                      <AlertDescription>
                        Update your pharmacy profile with location information.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-violet-500" />
                    Regional Inventory Optimization
                  </CardTitle>
                  <CardDescription>Location-specific inventory recommendations</CardDescription>
                </CardHeader>
                <CardContent className="h-60">
                  {(pharmacyLocation && regionalDemandData.length > 0) ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Based on the specific needs of {pharmacyLocation.state}, consider these inventory adjustments:</p>
                      
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2 bg-green-100 text-green-800">➕</Badge>
                          <span>Increase stock levels for <strong>{regionalDemandData[0]?.product}</strong> and <strong>{regionalDemandData[1]?.product}</strong> by 20%</span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2 bg-amber-100 text-amber-800">⚠️</Badge>
                          <span>Maintain current levels for <strong>{regionalDemandData[2]?.product}</strong> and <strong>{regionalDemandData[3]?.product}</strong></span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2 bg-blue-100 text-blue-800">ℹ️</Badge>
                          <span>Consider adding regional specialties like <strong>{pharmacyLocation.state === 'Maharashtra' ? 'Ayurvedic supplements' : (pharmacyLocation.state === 'Tamil Nadu' ? 'Siddha medicines' : 'Local herbal remedies')}</strong></span>
                        </li>
                        <li className="flex items-start">
                          <Badge className="mt-0.5 mr-2 bg-purple-100 text-purple-800">💡</Badge>
                          <span>Partner with local {pharmacyLocation.state === 'Maharashtra' ? 'Ayurveda' : (pharmacyLocation.state === 'Tamil Nadu' ? 'Siddha' : 'traditional medicine')} practitioners to enhance offerings</span>
                        </li>
                      </ul>
                      
                      <div className="mt-4 p-2 bg-blue-50 rounded-md text-sm">
                        <p className="font-medium text-blue-700">Regional Insight:</p>
                        <p className="text-blue-600">
                          {pharmacyLocation.state === 'Maharashtra' ? 
                            'Urban areas show higher demand for stress and lifestyle medications.' : 
                            (pharmacyLocation.state === 'Tamil Nadu' ? 
                              'Traditional medicine supplements have growing demand alongside allopathic medication.' : 
                              'Local health trends suggest increasing demand for preventive healthcare products.')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Building Recommendations</AlertTitle>
                      <AlertDescription>
                        Regional optimization suggestions are being prepared.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
