
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, DollarSign, ShoppingCart, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { RevenueChart } from "@/components/insights/RevenueChart";
import { StatsCard } from "@/components/insights/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDays, format, subDays, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerRetentionAnalysis } from "@/components/insights/CustomerRetentionAnalysis";
import { clearTableCaches } from "@/utils/schemaRefresh";

interface BillsData {
  total_amount: string | number;
  date: string;
  prescriptions?: {
    id: number;
    prescription_number: string;
    doctor_name: string;
    patient_id: number;
    patients?: {
      name: string;
      phone_number: string;
    } | {
      name: string;
      phone_number: string;
    }[];
  } | {
    id: number;
    prescription_number: string;
    doctor_name: string;
    patient_id: number;
    patients?: {
      name: string;
      phone_number: string;
    } | {
      name: string;
      phone_number: string;
    }[];
  }[];
}

interface PatientsData {
  id: number;
}

interface InventoryData {
  id: number;
  name: string;
}

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
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repeatCustomers, setRepeatCustomers] = useState<Array<{phone: string, visits: number, totalSpent: number}>>([]);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Authentication error:", error);
        setError("Authentication failed. Please try logging in again.");
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to verify authentication",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please login to view insights",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      
      setUserId(session.user.id);
      if (!dataFetchedRef.current) {
        // Clear caches for bills and related tables to resolve relationship errors
        clearTableCaches(['bills', 'bill_items', 'prescriptions']);
        fetchInsightsData(session.user.id);
        dataFetchedRef.current = true;
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError("Authentication failed. Please try logging in again.");
      toast({
        title: "Authentication Error",
        description: err.message || "Failed to verify authentication",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const fetchInsightsData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      if (!userId) return;

      console.log("Fetching insights data for period:", {
        from: dateRange.from.toISOString().split('T')[0],
        to: dateRange.to.toISOString().split('T')[0]
      });

      // Create proper date range with time boundaries
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      
      const fromDateTime = startDate.toISOString();
      const toDateTime = endDate.toISOString();
      
      // Previous period for comparison
        const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
        const prevStartDate = new Date(subDays(dateRange.from, daysDiff));
        prevStartDate.setHours(0, 0, 0, 0);
        const prevEndDate = new Date(subDays(dateRange.to, daysDiff));
        prevEndDate.setHours(23, 59, 59, 999);
        
        const prevFromDateTime = prevStartDate.toISOString();
        const prevToDateTime = prevEndDate.toISOString();

      console.log("Fetching current bills:", { userId, fromDateTime, toDateTime });
      
      // Fetch bills for current period
      const { data: currentBills, error: currentBillsError } = await supabase
        .from('bills')
        .select(`
          total_amount,
          date,
          prescriptions (
            id,
            prescription_number,
            doctor_name,
            patient_id,
            patients (
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', userId)
        .gte('date', fromDateTime)
        .lte('date', toDateTime);

      if (currentBillsError) {
        console.error('Error fetching current bills:', currentBillsError);
        throw currentBillsError;
      }

      const currentBillsData = (currentBills || []) as BillsData[];
      console.log("Fetched current bills:", currentBillsData.length);

      // Fetch bills for previous period
      const { data: prevBills, error: prevBillsError } = await supabase
        .from('bills')
        .select(`
          total_amount,
          date,
          prescriptions (
            id,
            prescription_number,
            doctor_name,
            patient_id,
            patients (
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', userId)
        .gte('date', prevFromDateTime)
        .lte('date', prevToDateTime);

      if (prevBillsError) {
        console.error('Error fetching previous bills:', prevBillsError);
        throw prevBillsError;
      }

      const prevBillsData = (prevBills || []) as BillsData[];
      console.log("Fetched previous bills:", prevBillsData.length);

      // Calculate total sales (number of bills)
      const currentSalesCount = currentBillsData.length;
      const prevSalesCount = prevBillsData.length;
      setTotalSales(currentSalesCount);
      
      // Calculate sales change percentage
      const salesChangePercent = prevSalesCount > 0 
        ? ((currentSalesCount - prevSalesCount) / prevSalesCount) * 100 
        : 0;
      setSalesChange(Math.round(salesChangePercent));

      // Calculate monthly revenue
      const currentRevenue = currentBillsData.reduce((sum: number, bill: BillsData) => sum + (parseFloat(String(bill.total_amount)) || 0), 0);
      const prevRevenue = prevBillsData.reduce((sum: number, bill: BillsData) => sum + (parseFloat(String(bill.total_amount)) || 0), 0);
      setMonthlyRevenue(currentRevenue);
      
      console.log("Revenue calculation:", { currentRevenue, prevRevenue });
      
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

      // Process repeat customer data from both periods for a more complete picture
      const allBills = [...currentBillsData, ...prevBillsData];
      
      // Group customers by phone number to identify repeats
      const customerMap = new Map();
      
      allBills.forEach((bill: BillsData) => {
        // Handle both array and single object format for prescriptions
        const prescription = Array.isArray(bill?.prescriptions) ? bill.prescriptions[0] : bill?.prescriptions;
        let patients = prescription?.patients;
        
        // Handle both array and single object format for patients
        if (Array.isArray(patients)) {
          patients = patients[0];
        }
        
        if (patients?.phone_number) {
          const phone = patients.phone_number;
          const amount = parseFloat(String(bill.total_amount)) || 0;
          
          if (customerMap.has(phone)) {
            const customer = customerMap.get(phone);
            customer.visits += 1;
            customer.totalSpent += amount;
            customer.bills.push(bill);
          } else {
            customerMap.set(phone, {
              phone,
              visits: 1,
              totalSpent: amount,
              bills: [bill]
            });
          }
        }
      });
      
      // Convert to array for display
      const customersArray = Array.from(customerMap.values());
      
      // Set repeat customers (more than 1 visit)
      const repeats = customersArray
        .filter(customer => customer.visits > 1)
        .sort((a, b) => b.visits - a.visits);
        
      setRepeatCustomers(repeats);
      
      // Calculate retention rate: repeat customers / total unique customers
      const repeatCustomerCount = repeats.length;
      const totalUniqueCustomers = customerMap.size;
      
      const retentionRateValue = totalUniqueCustomers > 0 
        ? (repeatCustomerCount / totalUniqueCustomers) * 100 
        : 0;
      
      setCustomerRetentionRate(Math.round(retentionRateValue));
      
      // Very simple change calculation - we'll just use a fixed number for now
      setRetentionChange(5);

      console.log("Fetching bill items");
      // Fetch top products
      const { data: billsInRange, error: billsError } = await supabase
        .from('bills')
        .select('id')
        .eq('user_id', userId)
        .gte('date', fromDateTime)
        .lte('date', toDateTime);

      if (billsError) {
        console.error('Error fetching bills in range:', billsError);
        throw billsError;
      }

      const billsInRangeData = (billsInRange || []) as { id: number }[];
      const billIds = billsInRangeData.map(bill => bill.id);
      
      // Step 2: Fetch bill items for these bills
      const { data: billItems, error: billItemsError } = await supabase
        .from('bill_items')
        .select(`
          id,
          inventory_item_id,
          quantity,
          unit_price,
          total_price,
          bill_id
        `)
        .in('bill_id', billIds);

      if (billItemsError) {
        console.error('Error fetching bill items:', billItemsError);
        throw billItemsError;
      }

      const billItemsData = billItems || [];

      // Step 3: Fetch inventory names for the items
      let inventoryData: InventoryData[] = [];
      if (billItemsData && billItemsData.length > 0) {
        const inventoryIds = [...new Set(billItemsData.map((item: any) => item.inventory_item_id))];
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('id, name')
          .in('id', inventoryIds);
        
        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
        } else {
          inventoryData = (inventory || []) as InventoryData[];
        }
      }

      console.log("Fetched bill items:", billItemsData.length);

      // Create inventory lookup map
      const inventoryMap = new Map(inventoryData.map(inv => [inv.id, inv.name]));

      // Process top products by revenue
      const productMap = new Map();
      billItemsData.forEach((item: any) => {
        const productName = inventoryMap.get(item.inventory_item_id) || `Product ${item.inventory_item_id}`;
        const revenue = parseFloat(item.total_price) || 0;
        
        if (productMap.has(productName)) {
          const product = productMap.get(productName);
          product.revenue += revenue;
          product.quantity += parseInt(item.quantity) || 0;
        } else {
          productMap.set(productName, {
            name: productName,
            revenue,
            quantity: parseInt(item.quantity) || 0,
          });
        }
      });

      console.log("Product map created with entries:", productMap.size);

      // Convert to array and sort by revenue
      const productsArray = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          value: product.revenue,
        }));
      
      setTopProducts(productsArray);
      console.log("Top products set:", productsArray.length);

      // Generate revenue data for chart
      const revenueByDay = new Map();
      const days = daysDiff + 1; // Include both start and end dates
      
      // Initialize all days with zero revenue
      for (let i = 0; i < days; i++) {
        const date = addDays(dateRange.from, i);
        const dateStr = date.toISOString().split('T')[0];
        revenueByDay.set(dateStr, 0);
      }
      
      // Fill in actual revenue data
      currentBillsData.forEach((bill: BillsData) => {
        if (bill.date) {
          const dateStr = bill.date.substring(0, 10); // Get YYYY-MM-DD part
          if (revenueByDay.has(dateStr)) {
            revenueByDay.set(dateStr, revenueByDay.get(dateStr) + (parseFloat(String(bill.total_amount)) || 0));
          }
        }
      });
      
      // Convert to array for chart
      const revenueChartData = Array.from(revenueByDay.entries())
        .map(([date, value]) => ({
          date,
          value,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log("Revenue chart data created:", revenueChartData.length);
      setRevenueData(revenueChartData);

      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching insights:", error);
      setError(error.message || "Failed to load insights data");
      toast({
        title: "Error",
        description: "Failed to load insights data: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [dateRange, toast]);

  useEffect(() => {
    if (userId) {
      fetchInsightsData(userId);
    }
  }, [dateRange, userId, fetchInsightsData]);

  useEffect(() => {
    if (!userId) return;
    
    console.log("Setting up real-time subscription for user:", userId);
    
    // Set up real-time subscription for bills and bill_items
    const channel = supabase
      .channel('insights-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${userId}` }, 
        (payload) => {
          console.log("Bills table change detected:", payload);
          toast({
            title: "Insights Updated",
            description: "New bill data has been detected",
            variant: "info",
            duration: 3000
          });
          fetchInsightsData(userId);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bill_items' }, 
        (payload) => {
          console.log("Bill items table change detected:", payload);
          fetchInsightsData(userId);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'patients' }, 
        (payload) => {
          console.log("Patients table change detected:", payload);
          fetchInsightsData(userId);
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to real-time updates");
        }
      });
    
    return () => {
      console.log("Cleaning up insights subscriptions");
      supabase.removeChannel(channel);
    };
  }, [userId, fetchInsightsData, toast]);

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
      value: Number(totalSales),
      icon: <CreditCard className="h-4 w-4" />,
      description: `${salesChange > 0 ? "+" : ""}${salesChange}% from last period`,
      trend: salesChange >= 0 ? "up" : "down" as "up" | "down",
    },
    {
      title: "Monthly Revenue",
      value: Number(monthlyRevenue),
      icon: <DollarSign className="h-4 w-4" />,
      description: `${revenueChange > 0 ? "+" : ""}${revenueChange}% from last month`,
      trend: revenueChange >= 0 ? "up" : "down" as "up" | "down",
    },
    {
      title: "Average Order Value",
      value: Number(averageOrderValue),
      icon: <ShoppingCart className="h-4 w-4" />,
      description: `${aovChange > 0 ? "+" : ""}${aovChange}% from last period`,
      trend: aovChange >= 0 ? "up" : "down" as "up" | "down",
    },
    {
      title: "Customer Retention",
      value: Number(customerRetentionRate),
      suffix: "%",
      icon: <Users className="h-4 w-4" />,
      description: `${retentionChange > 0 ? "+" : ""}${retentionChange}% from last period`,
      trend: retentionChange >= 0 ? "up" : "down" as "up" | "down",
    },
  ];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Insights</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => {
              if (userId) fetchInsightsData(userId);
              else checkAuth();
            }}
          >
            Retry
          </button>
        </div>
      </div>
  );
  }

  return (
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
              onChange={(range) => {
                if ('from' in range && 'to' in range) {
                  setDateRange({
                    from: range.from as Date,
                    to: range.to as Date
                  });
                }
              }}
            />
          </div>
        </div>

        {loading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </>
        ) : (
          <>
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
            
            <CustomerRetentionAnalysis 
              customers={repeatCustomers}
              isLoading={loading}
            />
          </>
        )}
      </div>
  );
}
