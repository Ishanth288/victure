import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Target,
  Star,
  Award,
  ChevronLeft,
  RefreshCw,
  Filter,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { hapticFeedback } from "@/utils/mobileUtils";

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentSales: Array<{
    date: string;
    amount: number;
  }>;
}

const MobileInsights: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    topSellingProducts: [],
    recentSales: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchInsights();
  }, [timeFilter]);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentDate = new Date();
      const startDate = new Date();
      
      switch (timeFilter) {
        case '7d':
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(currentDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(currentDate.getDate() - 90);
          break;
      }

      // Fetch basic metrics
      const [billsRes, patientsRes, inventoryRes] = await Promise.all([
        supabase
          .from('bills')
          .select('total_amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('inventory')
          .select('id, name, quantity, selling_price')
          .eq('user_id', user.id)
      ]);

      const bills = billsRes.data || [];
      const patients = patientsRes.data || [];
      const inventory = inventoryRes.data || [];

      // Calculate metrics
      const totalRevenue = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
      const totalOrders = bills.length;
      
      // Generate mock data for demonstration
      const mockMetrics: DashboardMetrics = {
        totalRevenue,
        totalOrders,
        totalCustomers: patients.length,
        totalProducts: inventory.length,
        revenueGrowth: Math.random() * 40 - 20, // -20% to +20%
        ordersGrowth: Math.random() * 30 - 15, // -15% to +15%
        topSellingProducts: [
          { name: 'Paracetamol 500mg', sales: 120, revenue: 2400 },
          { name: 'Amoxicillin 250mg', sales: 85, revenue: 3400 },
          { name: 'Vitamin D3', sales: 95, revenue: 1900 },
          { name: 'Omeprazole 20mg', sales: 70, revenue: 2100 },
          { name: 'Metformin 500mg', sales: 60, revenue: 1800 }
        ],
        recentSales: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          amount: Math.random() * 5000 + 1000
        })).reverse()
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = async () => {
    await hapticFeedback('light');
    navigate('/mobile');
  };

  const handleRefresh = async () => {
    await hapticFeedback('medium');
    await fetchInsights();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      value: `${isPositive ? '+' : ''}${growth.toFixed(1)}%`,
      color: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      icon: isPositive ? TrendingUp : TrendingDown
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center animate-bounce-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">Loading Insights</p>
          <p className="text-body text-gray-600 dark:text-gray-400">Analyzing your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 safe-area-all">
      <div className="max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={handleBack} 
              variant="ghost" 
              size="sm"
              className="btn-apple focus-ring p-2 -ml-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-title-2 font-bold text-gray-900 dark:text-white">Business Insights</h1>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="btn-apple focus-ring p-2 -mr-2"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-6 pb-32 space-y-6">
          {/* Time Filter */}
          <div className="flex space-x-3 pt-6 animate-slide-down">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                onClick={async () => {
                  await hapticFeedback('light');
                  setTimeFilter(period);
                }}
                variant={timeFilter === period ? "default" : "outline"}
                size="sm"
                className={`btn-apple focus-ring flex-1 ${
                  timeFilter === period 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                    : 'btn-secondary'
                }`}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <div className="card-apple p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.totalRevenue)}
                  </p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Revenue</p>
                </div>
              </div>
              {metrics.revenueGrowth !== 0 && (
                <div className="flex items-center">
                  {React.createElement(formatGrowth(metrics.revenueGrowth).icon, { 
                    className: `w-4 h-4 mr-1 ${formatGrowth(metrics.revenueGrowth).color}` 
                  })}
                  <span className={`text-caption-2 font-medium ${formatGrowth(metrics.revenueGrowth).color}`}>
                    {formatGrowth(metrics.revenueGrowth).value}
                  </span>
                </div>
              )}
            </div>

            <div className="card-apple p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">{metrics.totalOrders}</p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Orders</p>
                </div>
              </div>
              {metrics.ordersGrowth !== 0 && (
                <div className="flex items-center">
                  {React.createElement(formatGrowth(metrics.ordersGrowth).icon, { 
                    className: `w-4 h-4 mr-1 ${formatGrowth(metrics.ordersGrowth).color}` 
                  })}
                  <span className={`text-caption-2 font-medium ${formatGrowth(metrics.ordersGrowth).color}`}>
                    {formatGrowth(metrics.ordersGrowth).value}
                  </span>
                </div>
              )}
            </div>

            <div className="card-apple p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">{metrics.totalCustomers}</p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Customers</p>
                </div>
              </div>
            </div>

            <div className="card-apple p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-title-2 font-bold text-gray-900 dark:text-white">{metrics.totalProducts}</p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">Products</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="card-apple animate-slide-up">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-gold-600 mr-2" />
                <h3 className="text-title-3 font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {metrics.topSellingProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-caption-1 font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-callout font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-caption-2 text-gray-600 dark:text-gray-400">{product.sales} units sold</p>
                    </div>
                  </div>
                  <p className="text-subhead font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Chart Representation */}
          <div className="card-apple animate-slide-up">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-title-3 font-semibold text-gray-900 dark:text-white">Recent Sales</h3>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {metrics.recentSales.map((sale, index) => {
                  const maxAmount = Math.max(...metrics.recentSales.map(s => s.amount));
                  const percentage = (sale.amount / maxAmount) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-caption-1 text-gray-600 dark:text-gray-400">
                          {new Date(sale.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-callout font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(sale.amount)}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up">
            <Button
              onClick={() => navigate('/mobile/inventory')}
              className="btn-apple btn-secondary focus-ring h-16"
            >
              <div className="text-center">
                <Package className="w-5 h-5 mx-auto mb-1" />
                <p className="text-caption-1">Inventory</p>
              </div>
            </Button>
            
            <Button
              onClick={() => navigate('/mobile/patients')}
              className="btn-apple btn-secondary focus-ring h-16"
            >
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto mb-1" />
                <p className="text-caption-1">Customers</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileInsights; 