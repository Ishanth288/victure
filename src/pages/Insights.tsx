
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, DollarSign, ShoppingCart, Users } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { RevenueChart } from "@/components/insights/RevenueChart";
import { StatsCard } from "@/components/insights/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { addDays, format, subDays, subMonths } from "date-fns";

export default function Insights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [period, setPeriod] = useState("30d");
  const [totalSales, setTotalSales] = useState(0);
  const [salesChange, setSalesChange] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [aovChange, setAovChange] = useState(0);
  const [customerRetentionRate, setCustomerRetentionRate] = useState(0);
  const [retentionChange, setRetentionChange] = useState(0);
  const [topProducts, setTopProducts] = useState<Array<{name: string, value: number}>>([]);
  const [revenueData, setRevenueData] = useState<Array<{date: string, value: number}>>([]);

  useEffect(() => {
    checkAuth();
    fetchInsightsData();
  }, [dateRange]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please login to view insights",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Format dates for query
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      
      // Previous period for comparison
      const daysDiff = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFromDate = format(subDays(dateRange.from, daysDiff), "yyyy-MM-dd");
      const prevToDate = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

      // Fetch bills for current period
      const { data: currentBills, error: billsError } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", fromDate)
        .lte("date", toDate);

      if (billsError) throw billsError;

      // Fetch bills for previous period
      const { data: prevBills, error: prevBillsError } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", prevFromDate)
        .lte("date", prevToDate);

      if (prevBillsError) throw prevBillsError;

      // Calculate total sales (number of bills)
      const currentSalesCount = currentBills?.length || 0;
      const prevSalesCount = prevBills?.length || 0;
      setTotalSales(currentSalesCount);
      
      // Calculate sales change percentage
      const salesChangePercent = prevSalesCount > 0 
        ? ((currentSalesCount - prevSalesCount) / prevSalesCount) * 100 
        : 0;
      setSalesChange(Math.round(salesChangePercent));

      // Calculate monthly revenue
      const currentRevenue = currentBills?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
      const prevRevenue = prevBills?.reduce((sum, bill) => sum + (bill.total_amount || 0), 0) || 0;
      setMonthlyRevenue(currentRevenue);
      
      // Calculate revenue change percentage
      const revenueChangePercent = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;
      setRevenueChange(Math.round(revenueChangePercent));

      // Calculate average order value
      const currentAOV = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
      const prevAOV = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0;
      setAverageOrderValue(currentAOV);
      
      // Calculate AOV change percentage
      const aovChangePercent = prevAOV > 0 
        ? ((currentAOV - prevAOV) / prevAOV) * 100 
        : 0;
      setAovChange(Math.round(aovChangePercent));

      // Fetch top products
      const { data: billItems, error: itemsError } = await supabase
        .from("bill_items")
        .select(`
          id,
          inventory_item_id,
          quantity,
          unit_price,
          total_price,
          bill_id,
          bills!inner(date, user_id),
          inventory!inner(name)
        `)
        .eq("bills.user_id", user.id)
        .gte("bills.date", fromDate)
        .lte("bills.date", toDate);

      if (itemsError) throw itemsError;

      // Process top products by revenue
      const productMap = new Map();
      billItems?.forEach(item => {
        const productName = item.inventory?.name || `Product ${item.inventory_item_id}`;
        const revenue = item.total_price || 0;
        
        if (productMap.has(productName)) {
          const product = productMap.get(productName);
          product.revenue += revenue;
          product.quantity += item.quantity || 0;
        } else {
          productMap.set(productName, {
            name: productName,
            revenue,
            quantity: item.quantity || 0,
          });
        }
      });

      // Convert to array and sort by revenue
      const productsArray = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          value: product.revenue,
        }));
      
      setTopProducts(productsArray);

      // Generate revenue data for chart
      const revenueByDay = new Map();
      const days = daysDiff + 1; // Include both start and end dates
      
      // Initialize all days with zero revenue
      for (let i = 0; i < days; i++) {
        const date = addDays(dateRange.from, i);
        const dateStr = format(date, "yyyy-MM-dd");
        revenueByDay.set(dateStr, 0);
      }
      
      // Fill in actual revenue data
      currentBills?.forEach(bill => {
        const dateStr = bill.date.substring(0, 10); // Get YYYY-MM-DD part
        if (revenueByDay.has(dateStr)) {
          revenueByDay.set(dateStr, revenueByDay.get(dateStr) + (bill.total_amount || 0));
        }
      });
      
      // Convert to array for chart
      const revenueChartData = Array.from(revenueByDay.entries())
        .map(([date, value]) => ({
          date,
          value,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setRevenueData(revenueChartData);

      // Calculate customer retention (simplified)
      // In a real app, this would be more complex, comparing repeat customers
      setCustomerRetentionRate(65); // Placeholder value
      setRetentionChange(5); // Placeholder value

      setLoading(false);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast({
        title: "Error",
        description: "Failed to load insights data",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    
    const today = new Date();
    let fromDate;
    
    switch (newPeriod) {
      case "7d":
        fromDate = subDays(today, 7);
        break;
      case "30d":
        fromDate = subDays(today, 30);
        break;
      case "90d":
        fromDate = subDays(today, 90);
        break;
      case "6m":
        fromDate = subMonths(today, 6);
        break;
      case "1y":
        fromDate = subMonths(today, 12);
        break;
      default:
        fromDate = subDays(today, 30);
    }
    
    setDateRange({
      from: fromDate,
      to: today,
    });
  };

  const stats = [
    {
      title: "Total Sales",
      value: totalSales,
      icon: <CreditCard className="h-4 w-4" />,
      description: `${salesChange > 0 ? "+" : ""}${salesChange}% from last period`,
      trend: salesChange >= 0 ? "up" : "down",
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenue,
      icon: <DollarSign className="h-4 w-4" />,
      description: `${revenueChange > 0 ? "+" : ""}${revenueChange}% from last month`,
      trend: revenueChange >= 0 ? "up" : "down",
    },
    {
      title: "Average Order Value",
      value: averageOrderValue,
      icon: <ShoppingCart className="h-4 w-4" />,
      description: `${aovChange > 0 ? "+" : ""}${aovChange}% from last period`,
      trend: aovChange >= 0 ? "up" : "down",
    },
    {
      title: "Customer Retention",
      value: customerRetentionRate,
      suffix: "%",
      icon: <Users className="h-4 w-4" />,
      description: `${retentionChange > 0 ? "+" : ""}${retentionChange}% from last period`,
      trend: retentionChange >= 0 ? "up" : "down",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <p>Loading insights...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Insights</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs 
              value={period} 
              onValueChange={handlePeriodChange}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
                <TabsTrigger value="6m">6M</TabsTrigger>
                <TabsTrigger value="1y">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>
          
          <ProductsChart data={topProducts} />
        </div>
      </div>
    </DashboardLayout>
  );
}
