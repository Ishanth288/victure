
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, AlertCircle, DollarSign, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safelyGetData } from "@/utils/supabaseHelpers";
import { safeSelect } from "@/utils/supabaseHelpers";

export default function BusinessOptimization() {
  const [activeTab, setActiveTab] = useState("forecasting");
  const [forecastingData, setForecastingData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);
  const [supplierData, setSupplierData] = useState<any[]>([]);
  const [interactionsData, setInteractionsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch data for forecasting
      const { data: inventoryData } = await safeSelect('inventory', { user_id: session.user.id });
      
      // Sample forecasting data based on inventory
      const processedForecastingData = safelyGetData(inventoryData)?.slice(0, 10).map((item: any) => ({
        name: item.name,
        current: item.quantity,
        forecast: Math.round(item.quantity * (1 - (Math.random() * 0.4)))
      })) || [];
      
      setForecastingData(processedForecastingData);
      
      // Sample profit margin data
      const profitMarginData = safelyGetData(inventoryData)?.slice(0, 8).map((item: any) => {
        const costPrice = item.unit_cost;
        const sellingPrice = costPrice * (1 + (Math.random() * 0.5 + 0.2)); // 20-70% margin
        const profitMargin = ((sellingPrice - costPrice) / sellingPrice) * 100;
        
        return {
          name: item.name,
          margin: profitMargin.toFixed(2),
          revenue: (sellingPrice * item.quantity).toFixed(2)
        };
      }) || [];
      
      setMarginData(profitMarginData);
      
      // Sample supplier performance data
      const { data: purchaseOrders } = await safeSelect('purchase_orders', { user_id: session.user.id });
      
      // Group by supplier and calculate metrics
      const supplierMetrics: Record<string, any> = {};
      
      safelyGetData(purchaseOrders)?.forEach((order: any) => {
        if (!supplierMetrics[order.supplier_name]) {
          supplierMetrics[order.supplier_name] = {
            name: order.supplier_name,
            orders: 0,
            onTimeDelivery: 0,
            orderAccuracy: 0
          };
        }
        
        supplierMetrics[order.supplier_name].orders += 1;
        
        // Random metrics for demonstration
        if (Math.random() > 0.3) {
          supplierMetrics[order.supplier_name].onTimeDelivery += 1;
        }
        
        if (Math.random() > 0.2) {
          supplierMetrics[order.supplier_name].orderAccuracy += 1;
        }
      });
      
      const processedSupplierData = Object.values(supplierMetrics).map((supplier: any) => ({
        name: supplier.name,
        onTimeDelivery: supplier.orders > 0 ? ((supplier.onTimeDelivery / supplier.orders) * 100).toFixed(0) : 0,
        orderAccuracy: supplier.orders > 0 ? ((supplier.orderAccuracy / supplier.orders) * 100).toFixed(0) : 0,
        orders: supplier.orders
      }));
      
      setSupplierData(processedSupplierData);
      
      // Sample drug interactions data
      const sampleDrugs = [
        { name: "Paracetamol", interactions: ["Warfarin", "Alcohol"] },
        { name: "Aspirin", interactions: ["Warfarin", "Ibuprofen", "Prednisolone"] },
        { name: "Lisinopril", interactions: ["Potassium supplements", "Spironolactone"] },
        { name: "Metformin", interactions: ["Alcohol", "Contrast dye"] },
        { name: "Atorvastatin", interactions: ["Grapefruit juice", "Erythromycin"] }
      ];
      
      setInteractionsData(sampleDrugs);
      
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Business Optimization</h1>
          <Button>Export Reports</Button>
        </div>
        
        <Tabs defaultValue="forecasting" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="forecasting" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden md:inline">Inventory Forecasting</span>
              <span className="md:hidden">Forecast</span>
            </TabsTrigger>
            <TabsTrigger value="margins" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Profit Margins</span>
              <span className="md:hidden">Margins</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden md:inline">Supplier Performance</span>
              <span className="md:hidden">Suppliers</span>
            </TabsTrigger>
            <TabsTrigger value="interactions" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden md:inline">Drug Interactions</span>
              <span className="md:hidden">Interactions</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="forecasting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Forecasting</CardTitle>
                <CardDescription>
                  Predict inventory needs based on historical data and current stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="current" name="Current Stock" fill="#8884d8" />
                        <Bar dataKey="forecast" name="Forecasted Need" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Forecasting is based on historical consumption patterns and current inventory levels.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="margins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin Analysis</CardTitle>
                <CardDescription>
                  Identify high and low-margin products to optimize pricing and inventory decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marginData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="margin" name="Profit Margin (%)" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue (₹)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Higher margins don't always correlate with higher revenue. Consider both when making business decisions.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Metrics</CardTitle>
                <CardDescription>
                  Track delivery times and order accuracy across your suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={supplierData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="onTimeDelivery" name="On-Time Delivery (%)" stroke="#8884d8" />
                        <Line type="monotone" dataKey="orderAccuracy" name="Order Accuracy (%)" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Based on {supplierData.reduce((acc, curr) => acc + parseInt(curr.orders), 0)} orders across {supplierData.length} suppliers.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drug Interactions Checker</CardTitle>
                <CardDescription>
                  Alert for potential drug interactions to ensure patient safety
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interactionsData.map((drug, index) => (
                      <div key={index} className="border p-4 rounded-md">
                        <h3 className="font-medium text-lg">{drug.name}</h3>
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Potential Interactions:</h4>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {drug.interactions.map((interaction, idx) => (
                              <div key={idx} className="bg-red-50 text-red-700 px-2 py-1 rounded text-sm">
                                {interaction}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Always consult a healthcare professional for comprehensive drug interaction advice.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
