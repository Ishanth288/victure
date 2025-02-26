
import { useState, useEffect, useRef } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Download, 
  Printer, 
  Calendar, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface SalesData {
  date: string;
  total: number;
}

interface TopProduct {
  name: string;
  value: number;
}

interface InsightMetrics {
  totalRevenue: number;
  averageOrder: number;
  totalOrders: number;
  totalCustomers: number;
  percentageChange: number;
  productsSold: number;
}

export default function Insights() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [metrics, setMetrics] = useState<InsightMetrics>({
    totalRevenue: 0,
    averageOrder: 0,
    totalOrders: 0,
    totalCustomers: 0,
    percentageChange: 0,
    productsSold: 0
  });
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInsights();
  }, [timeframe]);

  const getDateRange = () => {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return { start: subDays(now, 1), end: now };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };

  const fetchInsights = async () => {
    try {
      const { start, end } = getDateRange();
      
      // Fetch sales data
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('date, total_amount, bill_items(quantity)')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .order('date', { ascending: true });

      if (billsError) throw billsError;

      // Calculate metrics
      const totalRevenue = billsData.reduce((sum, bill) => sum + bill.total_amount, 0);
      const totalOrders = billsData.length;
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const productsSold = billsData.reduce((sum, bill) => 
        sum + bill.bill_items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
      );

      // Calculate percentage change from previous period
      const previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      const { data: previousData } = await supabase
        .from('bills')
        .select('total_amount')
        .gte('date', previousStart.toISOString())
        .lt('date', start.toISOString());

      const previousRevenue = previousData?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
      const percentageChange = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Get unique customers count
      const { count: totalCustomers } = await supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      setMetrics({
        totalRevenue,
        averageOrder,
        totalOrders,
        totalCustomers: totalCustomers || 0,
        percentageChange,
        productsSold
      });

      // Process sales data for chart
      const aggregatedSales = billsData.reduce((acc: Record<string, number>, curr) => {
        const date = format(new Date(curr.date), 'yyyy-MM-dd');
        acc[date] = (acc[date] || 0) + curr.total_amount;
        return acc;
      }, {});

      const formattedSales = Object.entries(aggregatedSales).map(([date, total]) => ({
        date: format(new Date(date), 'MMM dd'),
        total
      }));

      setSalesData(formattedSales);

      // Fetch top products
      const { data: productsData, error: productsError } = await supabase
        .from('bill_items')
        .select(`
          quantity,
          total_price,
          inventory_item:inventory (
            name
          )
        `)
        .gte('bill:bills(date)', start.toISOString())
        .lte('bill:bills(date)', end.toISOString());

      if (productsError) throw productsError;

      const productSales = productsData.reduce((acc: Record<string, number>, curr) => {
        const productName = curr.inventory_item.name;
        acc[productName] = (acc[productName] || 0) + curr.total_price;
        return acc;
      }, {});

      const topProductsData = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      setTopProducts(topProductsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`sales-report-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const StatCard = ({ title, value, icon: Icon, trend = 0 }: { 
    title: string; 
    value: string | number;
    icon: any;
    trend?: number;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {trend !== 0 && (
            <div className={`flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Sales Insights</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {['day', 'week', 'month', 'year'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              onClick={() => setTimeframe(period as any)}
              className="w-full"
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>

        <div ref={reportRef} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Revenue"
              value={`₹${metrics.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              trend={metrics.percentageChange}
            />
            <StatCard
              title="Average Order Value"
              value={`₹${metrics.averageOrder.toFixed(2)}`}
              icon={ShoppingCart}
            />
            <StatCard
              title="Products Sold"
              value={metrics.productsSold}
              icon={Package}
            />
            <StatCard
              title="Total Customers"
              value={metrics.totalCustomers}
              icon={Users}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    dataKey="date"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      formatter={(value: any) => [`₹${value}`, 'Revenue']}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#8884d8"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `₹${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
