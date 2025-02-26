
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
  Cell
} from "recharts";
import { Download, Printer, Calendar } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface SalesData {
  date: string;
  total: number;
}

interface TopProduct {
  name: string;
  value: number;
}

export default function Insights() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
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
        .select('date, total_amount')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString())
        .order('date', { ascending: true });

      if (billsError) throw billsError;

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

        <div className="grid grid-cols-4 gap-4 mb-6">
          {['day', 'week', 'month', 'year'].map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              onClick={() => setTimeframe(period as any)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>

        <div ref={reportRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#8884d8" 
                    strokeWidth={2}
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Distribution</CardTitle>
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
                    <Tooltip />
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
