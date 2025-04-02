
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getReturnAnalytics, calculateReturnMetrics } from "@/utils/returnUtils";
import { Badge } from "@/components/ui/badge";
import { Undo, CheckCircle } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28EFF'];

interface ReturnAnalysisTabProps {
  isLoading?: boolean;
}

export function ReturnAnalysisTab({ isLoading = false }: ReturnAnalysisTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [returnData, setReturnData] = useState<any[]>([]);
  const [returnMetrics, setReturnMetrics] = useState({
    totalReturns: 0,
    totalValue: 0,
    returnToInventory: 0,
    disposed: 0,
    returnToInventoryValue: 0,
    disposedValue: 0
  });
  const [topReturnedMedicines, setTopReturnedMedicines] = useState<any[]>([]);
  const [returnTrend, setReturnTrend] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && !isLoading) {
      fetchReturnData();
      setInitialized(true);
    }
  }, [initialized, isLoading]);

  useEffect(() => {
    if (initialized && !isLoading) {
      fetchReturnData();
    }
  }, [timeframe, initialized, isLoading]);

  const fetchReturnData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch return analytics data
      const data = await getReturnAnalytics(user.id, timeframe);
      setReturnData(data);

      // Calculate summary metrics
      const metrics = calculateReturnMetrics(data);
      setReturnMetrics(metrics);

      // Process top returned medicines
      const medicineMap = new Map();
      data.forEach((item: any) => {
        const existing = medicineMap.get(item.medicine_name) || { 
          name: item.medicine_name, 
          value: 0, 
          valueAmount: 0 
        };
        existing.value += item.returned_quantity || 0;
        existing.valueAmount += item.return_value || 0;
        medicineMap.set(item.medicine_name, existing);
      });
      
      const topMedicines = Array.from(medicineMap.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setTopReturnedMedicines(topMedicines);

      // Process return trend data
      const trendMap = new Map();
      let dateFormat = "MMM d, yyyy";
      
      if (timeframe === 'week') {
        dateFormat = "EEE";
      } else if (timeframe === 'month') {
        dateFormat = "MMM d";
      } else if (timeframe === 'year') {
        dateFormat = "MMM yyyy";
      }
      
      // Initialize the trend data with zeros for all days
      const today = new Date();
      let daysToLookBack;
      
      if (timeframe === 'week') {
        daysToLookBack = 7;
      } else if (timeframe === 'month') {
        daysToLookBack = 30;
      } else {
        daysToLookBack = 12; // For year, we'll group by months
      }
      
      // For week and month, initialize days with zeros
      if (timeframe !== 'year') {
        for (let i = daysToLookBack - 1; i >= 0; i--) {
          const date = subDays(today, i);
          const dateStr = format(date, dateFormat);
          trendMap.set(dateStr, {
            date: dateStr,
            inventory: 0,
            disposed: 0,
            total: 0
          });
        }
      } else {
        // For year, initialize months with zeros
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const dateStr = format(date, "MMM yyyy");
          trendMap.set(dateStr, {
            date: dateStr,
            inventory: 0,
            disposed: 0,
            total: 0
          });
        }
      }
      
      // Fill in actual return data
      data.forEach((item: any) => {
        const returnDate = new Date(item.return_date);
        let dateStr;
        
        if (timeframe === 'year') {
          dateStr = format(returnDate, "MMM yyyy");
        } else {
          dateStr = format(returnDate, dateFormat);
        }
        
        const existingData = trendMap.get(dateStr) || { 
          date: dateStr, 
          inventory: 0, 
          disposed: 0,
          total: 0
        };
        
        if (item.status === 'inventory') {
          existingData.inventory += item.returned_quantity;
        } else {
          existingData.disposed += item.returned_quantity;
        }
        existingData.total += item.returned_quantity;
        
        trendMap.set(dateStr, existingData);
      });
      
      // Convert map to array for charting
      const trendData = Array.from(trendMap.values());
      setReturnTrend(trendData);

      // Show success toast when data is loaded
      if (data.length > 0) {
        toast({
          title: "Return data loaded",
          description: `Found ${data.length} return records for the selected timeframe.`,
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error("Error fetching return data:", error);
      toast({
        title: "Error",
        description: "Failed to load return analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-24 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="ml-3">Loading return analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Return Analysis</h2>
        <Tabs defaultValue="month" value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{returnMetrics.totalReturns}</div>
            <p className="text-muted-foreground">Items returned</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Return Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{returnMetrics.totalValue.toFixed(2)}</div>
            <p className="text-muted-foreground">Total return value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Return to Inventory Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {returnMetrics.totalReturns > 0 
                ? Math.round((returnMetrics.returnToInventory / returnMetrics.totalReturns) * 100)
                : 0}%
            </div>
            <p className="text-muted-foreground">Returned to inventory vs. disposed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Returned Medicines</CardTitle>
            <CardDescription>
              Most frequently returned products
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {topReturnedMedicines.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No return data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topReturnedMedicines}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {topReturnedMedicines.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props: any) => [
                      `${value} units (₹${props.payload.valueAmount.toFixed(2)})`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Return Trend</CardTitle>
            <CardDescription>
              Return volumes over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {returnTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={returnTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inventory" name="Returned to Inventory" stackId="a" fill="#8884d8" />
                  <Bar dataKey="disposed" name="Disposed" stackId="a" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {returnData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Recent Returns</h3>
          <div className="space-y-3">
            {returnData.slice(0, 5).map((item, index) => (
              <div key={index} className="p-3 border rounded-md flex justify-between items-center">
                <div>
                  <div className="font-medium">{item.medicine_name}</div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(item.return_date), "MMM d, yyyy")} • {item.returned_quantity} units
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={item.status === "inventory" ? "secondary" : "destructive"}>
                    {item.status === "inventory" ? 
                      <><Undo className="h-3 w-3 mr-1" /> Returned to Stock</> : 
                      <><CheckCircle className="h-3 w-3 mr-1" /> Disposed</>
                    }
                  </Badge>
                  <div className="text-green-600 font-medium">₹{item.return_value?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            ))}
          </div>
          {returnData.length > 5 && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing 5 of {returnData.length} returns
              </p>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Return Analysis Insights</CardTitle>
          <CardDescription>
            Actionable insights based on return patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {returnData.length === 0 ? (
              <p className="text-muted-foreground">No return data available to generate insights</p>
            ) : (
              <>
                <div>
                  <h4 className="font-semibold">Return Value Analysis</h4>
                  <p className="text-muted-foreground">
                    {returnMetrics.totalValue > 5000 ? (
                      "High return value detected. Consider reviewing quality control and storage conditions."
                    ) : returnMetrics.totalValue > 1000 ? (
                      "Moderate return value. Regular monitoring recommended."
                    ) : (
                      "Low return value. Your current processes are working well."
                    )}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Inventory Recovery Rate</h4>
                  <p className="text-muted-foreground">
                    {returnMetrics.totalReturns > 0 && (returnMetrics.returnToInventory / returnMetrics.totalReturns) > 0.7 ? (
                      "Excellent inventory recovery rate. You're effectively reclaiming value from returns."
                    ) : returnMetrics.totalReturns > 0 && (returnMetrics.returnToInventory / returnMetrics.totalReturns) > 0.4 ? (
                      "Good recovery rate. Consider reviewing disposal criteria to improve further."
                    ) : (
                      "Low inventory recovery rate. Review your return assessment criteria to avoid unnecessary disposals."
                    )}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold">Frequently Returned Products</h4>
                  <p className="text-muted-foreground">
                    {topReturnedMedicines.length > 0 ? (
                      `${topReturnedMedicines[0].name} has the highest return rate. Consider investigating storage conditions, quality, or providing better usage instructions.`
                    ) : (
                      "No pattern of frequently returned products detected."
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
