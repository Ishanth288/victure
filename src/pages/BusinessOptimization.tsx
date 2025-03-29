
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { Loader2, AlertCircle, TrendingUp, BarChart2, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BusinessOptimization() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const { toast } = useToast();

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
        .subscribe();
        
      return () => {
        supabase.removeChannel(inventoryChannel);
      };
    };
    
    const cleanup = setupSubscriptions();
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, [fetchData]);

  // Prepare data for forecasting
  const prepareForecastData = () => {
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
      amount
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

  const forecastData = prepareForecastData();
  const marginData = prepareMarginData();
  const supplierData = prepareSupplierData();
  const expiryData = prepareExpiryData();

  if (isLoading) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Business Optimization</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
        
        <Tabs defaultValue="forecast">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="forecast" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Forecasting
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
            <TabsTrigger value="interactions" className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Drug Interactions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="forecast" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Forecast</CardTitle>
                <CardDescription>Projected sales based on historical data</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
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
                  <CardTitle>Inventory Forecast</CardTitle>
                  <CardDescription>Projected inventory needs</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Advanced Feature</AlertTitle>
                    <AlertDescription>
                      Inventory forecasting will be available with more historical data.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Trends</CardTitle>
                  <CardDescription>Product demand by season</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Advanced Feature</AlertTitle>
                    <AlertDescription>
                      Seasonal trend analysis requires at least 12 months of data.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="margin" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin by Product</CardTitle>
                <CardDescription>Highest margin products</CardDescription>
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
                  <CardTitle>Category Analysis</CardTitle>
                  <CardDescription>Profit by product category</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      Category analysis will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Price Optimization</CardTitle>
                  <CardDescription>Recommended price points</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Premium Feature</AlertTitle>
                    <AlertDescription>
                      Price optimization requires subscription to Premium plan.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="supplier" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
                <CardDescription>On-time delivery performance</CardDescription>
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
                  <CardTitle>Cost Comparison</CardTitle>
                  <CardDescription>Price comparison by supplier</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Data Required</AlertTitle>
                    <AlertDescription>
                      Add more purchase orders to enable supplier cost comparison.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Lead Time Analysis</CardTitle>
                  <CardDescription>Order fulfillment time by supplier</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      Lead time analysis will be available in the next update.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="expiry" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Expiry Analysis</CardTitle>
                <CardDescription>Products expiring soon</CardDescription>
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
                  <CardTitle>Expiry Calendar</CardTitle>
                  <CardDescription>Timeline of product expirations</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Coming Soon</AlertTitle>
                    <AlertDescription>
                      Expiry calendar will be available in the next update.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Loss Prevention</CardTitle>
                  <CardDescription>Suggestions to minimize expired product loss</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Premium Feature</AlertTitle>
                    <AlertDescription>
                      Loss prevention recommendations require subscription to Premium plan.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="interactions" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Drug Interactions Checker</CardTitle>
                <CardDescription>Check for potential drug interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
                  <h3 className="text-xl font-medium mb-2">Premium Feature</h3>
                  <p className="text-center text-gray-500 max-w-md">
                    The Drug Interactions Checker is a premium feature that requires integration with a medical database. 
                    Upgrade your plan to access this feature.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Interactions</CardTitle>
                  <CardDescription>Frequently identified drug interactions</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Premium Feature</AlertTitle>
                    <AlertDescription>
                      This feature requires the premium subscription plan.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Patient Risk Assessment</CardTitle>
                  <CardDescription>Identify patients at risk for drug interactions</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Premium Feature</AlertTitle>
                    <AlertDescription>
                      This feature requires the premium subscription plan.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
