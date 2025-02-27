
import { useState, useEffect, useRef } from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Download, Printer, Calendar, DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { StatCard } from "@/components/insights/StatCard";
import { TimeframeSelector } from "@/components/insights/TimeframeSelector";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";
import { ProductsChart } from "@/components/insights/ProductsChart";
import { RevenueDistribution } from "@/components/insights/RevenueDistribution";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
        const productName = curr.inventory_item?.name || 'Unknown';
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
      // Create canvas from the content
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add watermark
      pdf.setFontSize(12);
      pdf.setTextColor(180, 180, 180);
      pdf.text('Victure', pdf.internal.pageSize.getWidth() - 20, 10);
      
      // Save PDF
      pdf.save(`sales-report-${timeframe}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Export successful",
        description: "The insights report has been exported as a PDF.",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export failed",
        description: "Failed to export the insights report.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    
    const printContent = reportRef.current;
    const originalDisplay = document.body.style.display;
    const originalOverflow = document.body.style.overflow;
    
    // Create a style element for print
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
          overflow: visible !important;
        }
        #print-content, #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add ID to print content
    printContent.setAttribute('id', 'print-content');
    
    // Prepare for printing
    document.body.style.overflow = 'visible';
    
    // Print
    window.print();
    
    // Cleanup
    printContent.removeAttribute('id');
    document.body.style.display = originalDisplay;
    document.body.style.overflow = originalOverflow;
    document.head.removeChild(style);
    
    toast({
      title: "Print job sent",
      description: "The report has been sent to your printer.",
    });
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

        <TimeframeSelector 
          timeframe={timeframe} 
          onTimeframeChange={setTimeframe} 
        />

        <div ref={reportRef} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <RevenueTrendChart data={salesData} />

          <div className="grid md:grid-cols-2 gap-6">
            <ProductsChart data={topProducts} />
            <RevenueDistribution data={topProducts} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
