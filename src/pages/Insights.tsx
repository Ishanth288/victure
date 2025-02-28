
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";
import { RevenueDistribution } from "@/components/insights/RevenueDistribution";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { StatCard } from "@/components/insights/StatCard";
import { TimeframeSelector } from "@/components/insights/TimeframeSelector";
import { supabase } from "@/integrations/supabase/client";
import { ArrowDown, ArrowUp, DollarSign, Users, ShoppingCart, Package } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export default function Insights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    revenueChange: 0,
    patients: 0,
    patientsChange: 0,
    orders: 0,
    ordersChange: 0,
    products: 0,
    productsChange: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      fetchInsightsData();
    }
  }, [timeframe]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to view insights",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setLoading(false);
      fetchInsightsData();
    } catch (error) {
      console.error("Auth check error:", error);
      toast({
        title: "Error",
        description: "Authentication check failed",
        variant: "destructive",
      });
    }
  };

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Set date range based on timeframe
      let startDate;
      let previousStartDate;
      let interval: 'day' | 'week' | 'month';
      const now = new Date();

      switch(timeframe) {
        case 'day':
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          previousStartDate = subDays(startDate, 1);
          interval = 'day';
          break;
        case 'week':
          startDate = startOfWeek(now);
          previousStartDate = subDays(startDate, 7);
          interval = 'day';
          break;
        case 'month':
          startDate = startOfMonth(now);
          previousStartDate = subDays(startDate, 30);
          interval = 'week';
          break;
        case 'year':
          startDate = startOfYear(now);
          previousStartDate = subDays(startDate, 365);
          interval = 'month';
          break;
      }

      // Fetch data for the current period
      const { data: currentBills } = await supabase
        .from('bills')
        .select(`
          id, 
          date, 
          total_amount,
          bill_items (
            inventory_item_id,
            quantity
          )
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString());

      // Fetch data for the previous period
      const { data: previousBills } = await supabase
        .from('bills')
        .select('total_amount')
        .eq('user_id', user.id)
        .gte('date', previousStartDate.toISOString())
        .lt('date', startDate.toISOString());

      // Fetch patients data
      const { data: patients } = await supabase
        .from('patients')
        .select('id, created_at')
        .eq('user_id', user.id);

      // Fetch inventory data
      const { data: inventory } = await supabase
        .from('inventory')
        .select('id, name, quantity, unit_cost')
        .eq('user_id', user.id);

      // Calculate stats
      const currentRevenue = currentBills?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const previousRevenue = previousBills?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const revenueChange = previousRevenue ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const currentPatients = patients?.filter(p => new Date(p.created_at) >= startDate).length || 0;
      const previousPatients = patients?.filter(p => 
        new Date(p.created_at) >= previousStartDate && new Date(p.created_at) < startDate
      ).length || 0;
      const patientsChange = previousPatients ? ((currentPatients - previousPatients) / previousPatients) * 100 : 0;

      // Generate revenue trend data based on timeframe
      let revenueChartData: any[] = [];
      
      if (currentBills) {
        if (timeframe === 'day') {
          // Group by hour
          const hourlyData: {[key: string]: number} = {};
          for (let i = 0; i < 24; i++) {
            hourlyData[i.toString()] = 0;
          }
          
          currentBills.forEach(bill => {
            const date = new Date(bill.date);
            const hour = date.getHours().toString();
            hourlyData[hour] = (hourlyData[hour] || 0) + bill.total_amount;
          });
          
          revenueChartData = Object.entries(hourlyData).map(([hour, amount]) => ({
            name: `${hour}:00`,
            value: Number(amount)  // Ensure amount is a number
          }));
        } else if (timeframe === 'week') {
          // Group by day of the week
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dailyData: {[key: string]: number} = {};
          daysOfWeek.forEach(day => { dailyData[day] = 0; });
          
          currentBills.forEach(bill => {
            const date = new Date(bill.date);
            const day = daysOfWeek[date.getDay()];
            dailyData[day] = (dailyData[day] || 0) + bill.total_amount;
          });
          
          revenueChartData = Object.entries(dailyData).map(([day, amount]) => ({
            name: day.substring(0, 3),
            value: Number(amount)  // Ensure amount is a number
          }));
        } else if (timeframe === 'month') {
          // Group by date
          const dailyData: {[key: string]: number} = {};
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          
          for (let i = 1; i <= daysInMonth; i++) {
            dailyData[i.toString()] = 0;
          }
          
          currentBills.forEach(bill => {
            const date = new Date(bill.date);
            const day = date.getDate().toString();
            dailyData[day] = (dailyData[day] || 0) + bill.total_amount;
          });
          
          revenueChartData = Object.entries(dailyData).map(([day, amount]) => ({
            name: day,
            value: Number(amount)  // Ensure amount is a number
          }));
        } else if (timeframe === 'year') {
          // Group by month
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyData: {[key: string]: number} = {};
          months.forEach(month => { monthlyData[month] = 0; });
          
          currentBills.forEach(bill => {
            const date = new Date(bill.date);
            const month = months[date.getMonth()];
            monthlyData[month] = (monthlyData[month] || 0) + bill.total_amount;
          });
          
          revenueChartData = Object.entries(monthlyData).map(([month, amount]) => ({
            name: month,
            value: Number(amount)  // Ensure amount is a number
          }));
        }
      }

      // Generate revenue distribution data (by product category)
      const itemFrequency: {[key: number]: number} = {};
      currentBills?.forEach(bill => {
        bill.bill_items.forEach((item: any) => {
          const itemId = item.inventory_item_id;
          if (itemFrequency[itemId]) {
            itemFrequency[itemId] += item.quantity;
          } else {
            itemFrequency[itemId] = item.quantity;
          }
        });
      });

      // Map inventory items to their names
      const inventoryMap = new Map();
      inventory?.forEach(item => {
        inventoryMap.set(item.id, { name: item.name, unit_cost: item.unit_cost });
      });

      // Top 5 products by revenue
      const productRevenueData = Object.entries(itemFrequency)
        .map(([itemId, quantity]) => {
          const item = inventoryMap.get(parseInt(itemId));
          return {
            name: item?.name || `Item #${itemId}`,
            value: quantity * (item?.unit_cost || 0)
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Calculate total orders and order change
      const currentOrders = currentBills?.length || 0;
      const previousOrders = previousBills?.length || 0;
      const ordersChange = previousOrders ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

      // Calculate total products and product change
      // For this example, we'll count how many unique products were sold
      const currentProductsSold = new Set();
      currentBills?.forEach(bill => {
        bill.bill_items.forEach((item: any) => {
          currentProductsSold.add(item.inventory_item_id);
        });
      });
      const productsCount = currentProductsSold.size;
      const productsChange = (productsCount / (inventory?.length || 1)) * 100;

      // Prepare top products data
      const topProducts = Object.entries(itemFrequency)
        .map(([itemId, quantity]) => {
          const item = inventoryMap.get(parseInt(itemId));
          return {
            id: parseInt(itemId),
            name: item?.name || `Item #${itemId}`,
            quantity: quantity,
            revenue: quantity * (item?.unit_cost || 0)
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      // Update state with calculated data
      setStats({
        revenue: currentRevenue,
        revenueChange: revenueChange,
        patients: currentPatients,
        patientsChange: patientsChange,
        orders: currentOrders,
        ordersChange: ordersChange,
        products: productsCount,
        productsChange: productsChange
      });

      setRevenueData(revenueChartData);
      setDistributionData(productRevenueData);
      setProductsData(topProducts);

    } catch (error) {
      console.error("Error fetching insights data:", error);
      toast({
        title: "Error",
        description: "Failed to load insights data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-8">
        <h1 className="text-3xl font-bold">Business Insights</h1>
        
        <TimeframeSelector timeframe={timeframe} onTimeframeChange={setTimeframe} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            description={`${Math.abs(stats.revenueChange).toFixed(1)}% ${stats.revenueChange >= 0 ? 'increase' : 'decrease'}`}
            icon={DollarSign}
            trend={stats.revenueChange >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="New Patients"
            value={stats.patients.toString()}
            description={`${Math.abs(stats.patientsChange).toFixed(1)}% ${stats.patientsChange >= 0 ? 'increase' : 'decrease'}`}
            icon={Users}
            trend={stats.patientsChange >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Orders"
            value={stats.orders.toString()}
            description={`${Math.abs(stats.ordersChange).toFixed(1)}% ${stats.ordersChange >= 0 ? 'increase' : 'decrease'}`}
            icon={ShoppingCart}
            trend={stats.ordersChange >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Products Sold"
            value={stats.products.toString()}
            description={`${stats.productsChange.toFixed(1)}% of inventory`}
            icon={Package}
            trend="neutral"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  Loading...
                </div>
              ) : (
                <RevenueTrendChart data={revenueData} timeframe={timeframe} />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  Loading...
                </div>
              ) : (
                <RevenueDistribution data={distributionData} />
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                Loading...
              </div>
            ) : (
              <ProductsChart data={productsData} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
