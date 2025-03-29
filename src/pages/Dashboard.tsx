
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { StatCard } from "@/components/insights/StatCard";
import { StatsCard } from "@/components/insights/StatsCard";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";
import { RevenueDistribution } from "@/components/insights/RevenueDistribution";
import { RevenueChart } from "@/components/insights/RevenueChart";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { TaskManagement } from "@/components/TaskManagement";
import { DocumentManagement } from "@/components/DocumentManagement";
import { CalendarComponent } from "@/components/CalendarComponent";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, subDays } from "date-fns";
import { Pill, Users, ShoppingCart, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Bill {
  id: number;
  bill_number: string;
  date: string;
  total_amount: number;
  prescription_id?: number;
  status: string;
  // Add other bill properties as needed
}

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  reorder_point?: number;
  // Add other inventory properties as needed
}

interface Patient {
  id: number;
  name: string;
  // Add other patient properties as needed
}

export default function Dashboard() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<Bill[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [patientsData, setPatientsData] = useState<Patient[]>([]);
  const [revenueData, setRevenueData] = useState<{date: string, value: number}[]>([]);
  const [topProducts, setTopProducts] = useState<{name: string, value: number}[]>([]);
  const [revenueDistribution, setRevenueDistribution] = useState<{name: string, value: number}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // Fetch sales data from bills
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('*');
        
        if (billsError) throw billsError;
        
        // Fetch inventory data
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*');
        
        if (inventoryError) throw inventoryError;
        
        // Fetch patients data
        const { data: patients, error: patientsError } = await supabase
          .from('patients')
          .select('*');
        
        if (patientsError) throw patientsError;
        
        // Process data with proper type safety
        setSalesData(bills || []);
        setInventoryData(inventory || []);
        setPatientsData(patients || []);
        
        // Generate revenue data for chart
        if (bills && bills.length > 0) {
          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = subDays(new Date(), i);
            return {
              date: format(date, 'yyyy-MM-dd'),
              value: 0
            };
          }).reverse();
          
          const billsByDate = new Map<string, number>();
          
          bills.forEach(bill => {
            const billDate = bill.date ? format(new Date(bill.date), 'yyyy-MM-dd') : null;
            if (billDate) {
              const existingAmount = billsByDate.get(billDate) || 0;
              billsByDate.set(billDate, existingAmount + bill.total_amount);
            }
          });
          
          const revenueByDate = last30Days.map(day => {
            return {
              ...day,
              value: billsByDate.get(day.date) || 0
            };
          });
          
          setRevenueData(revenueByDate);
          
          // Calculate top products
          if (bills.length > 0) {
            const productCountMap = new Map<string, number>();
            
            bills.forEach(bill => {
              // This is a simplified version as we don't have bill_items details
              // In a real implementation, you would count actual products
              if (bill.prescription_id) {
                const productName = `Prescription #${bill.prescription_id}`;
                const existingValue = productCountMap.get(productName) || 0;
                productCountMap.set(productName, existingValue + bill.total_amount);
              }
            });
            
            const productArray = Array.from(productCountMap.entries()).map(([name, value]) => ({
              name,
              value
            }));
            
            // Sort by value in descending order and take top 5
            const topProductsData = productArray
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            
            setTopProducts(topProductsData);
          }
          
          // Calculate revenue distribution
          if (bills.length > 0) {
            const categoryMap = new Map<string, number>();
            categoryMap.set('Prescription', 0);
            categoryMap.set('OTC Medicines', 0);
            categoryMap.set('Medical Supplies', 0);
            categoryMap.set('Other', 0);
            
            bills.forEach(bill => {
              if (bill.prescription_id) {
                const existingValue = categoryMap.get('Prescription') || 0;
                categoryMap.set('Prescription', existingValue + bill.total_amount);
              } else {
                // Random distribution for demo purposes
                const rand = Math.random();
                if (rand < 0.3) {
                  const existingValue = categoryMap.get('OTC Medicines') || 0;
                  categoryMap.set('OTC Medicines', existingValue + bill.total_amount);
                } else if (rand < 0.6) {
                  const existingValue = categoryMap.get('Medical Supplies') || 0;
                  categoryMap.set('Medical Supplies', existingValue + bill.total_amount);
                } else {
                  const existingValue = categoryMap.get('Other') || 0;
                  categoryMap.set('Other', existingValue + bill.total_amount);
                }
              }
            });
            
            const distributionData = Array.from(categoryMap.entries())
              .filter(([_, value]) => value > 0)
              .map(([name, value]) => ({
                name,
                value
              }));
            
            setRevenueDistribution(distributionData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error loading dashboard",
          description: "Could not load dashboard data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  // Calculate summary statistics
  const totalRevenue = salesData && salesData.length > 0
    ? salesData.reduce((sum, bill) => sum + (bill.total_amount || 0), 0)
    : 0;
  
  const totalInventoryValue = inventoryData && inventoryData.length > 0
    ? inventoryData.reduce((sum, item) => sum + (item.unit_cost * item.quantity || 0), 0)
    : 0;
  
  const lowStockItems = inventoryData && inventoryData.length > 0
    ? inventoryData.filter(item => 
        (item.quantity || 0) < (item.reorder_point || 10)
      ).length
    : 0;
  
  const totalPatients = patientsData?.length || 0;

  // Generate data for trend chart
  const trendData = [
    { name: 'Jan', value: 5000 },
    { name: 'Feb', value: 7000 },
    { name: 'Mar', value: 6000 },
    { name: 'Apr', value: 8000 },
    { name: 'May', value: 9500 },
    { name: 'Jun', value: 11000 },
    { name: 'Jul', value: 10000 },
  ];

  // Show dashboard help dialog on first visit
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('dashboard-help-seen');
    if (!hasSeenHelp) {
      setIsHelpOpen(true);
      localStorage.setItem('dashboard-help-seen', 'true');
    }
  }, []);

  return (
    <DashboardLayout>
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Your Dashboard</DialogTitle>
            <DialogDescription>
              Here you can view all your pharmacy metrics in one place. The dashboard shows key performance indicators, revenue trends, top-selling products, and more. Explore the various sections to get insights into your business performance.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        
        {/* KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={TrendingUp}
            trend={2.5}
          />
          <StatCard
            title="Inventory Value"
            value={`₹${totalInventoryValue.toLocaleString('en-IN')}`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Total Patients"
            value={totalPatients}
            icon={Users}
            trend={4.2}
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockItems}
            icon={AlertCircle}
            trend={-1.5}
          />
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading revenue data...</p>
                </div>
              ) : revenueData.length > 0 ? (
                <RevenueChart data={revenueData} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Revenue Data</AlertTitle>
                  <AlertDescription>
                    There is no revenue data available for the last 30 days.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading distribution data...</p>
                </div>
              ) : revenueDistribution.length > 0 ? (
                <RevenueDistribution data={revenueDistribution} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Distribution Data</AlertTitle>
                  <AlertDescription>
                    There is not enough sales data to show revenue distribution.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Second Row of Charts and Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <p>Loading product data...</p>
                </div>
              ) : topProducts.length > 0 ? (
                <ProductsChart data={topProducts} />
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Product Data</AlertTitle>
                  <AlertDescription>
                    There is not enough sales data to show top products.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueTrendChart data={trendData} />
            </CardContent>
          </Card>
        </div>
        
        {/* Management Tools Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskManagement />
          <CalendarComponent />
          <DocumentManagement />
        </div>
      </div>
    </DashboardLayout>
  );
}
