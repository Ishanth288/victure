import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileScanner } from "@/hooks/useMobileScanner";
import CameraScanner from "./CameraScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Users, 
  FileText, 
  DollarSign, 
  Camera,
  Settings,
  BarChart3,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bell,
  Zap,
  Sparkles,
  ChevronRight,
  Eye,
  Activity,
  ShoppingCart,
  Clock,
  Target,
  Star,
  Home
} from "lucide-react";
import { hapticFeedback } from "@/utils/mobileUtils";

interface DashboardStats {
  totalInventory: number;
  totalPatients: number;
  todaysBills: number;
  todaysRevenue: number;
  lowStockItems: number;
  weeklyGrowth: number;
}

export function MobileDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isScannerOpen, openScanner, closeScanner, processMedicine } = useMobileScanner();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInventory: 0,
    totalPatients: 0,
    todaysBills: 0,
    todaysRevenue: 0,
    lowStockItems: 0,
    weeklyGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    console.log('MobileDashboard: useEffect triggered.');
    checkAuth();
    fetchDashboardStats();

    return () => clearInterval(timer);
  }, []);

  const checkAuth = async () => {
    console.log('MobileDashboard: Checking authentication...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('MobileDashboard: No active session, navigating to /auth.');
      navigate('/auth');
      return;
    }
    setUser(session.user);
    console.log('MobileDashboard: User authenticated:', session.user.email);
  };

  const fetchDashboardStats = async () => {
    try {
      console.log('MobileDashboard: Fetching dashboard stats...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [inventoryRes, patientsRes, billsRes, lastWeekBillsRes] = await Promise.all([
        supabase.from('inventory').select('id, quantity, reorder_point').eq('user_id', user.id),
        supabase.from('patients').select('id').eq('user_id', user.id),
        supabase.from('bills').select('id, total_amount').eq('user_id', user.id).gte('created_at', today),
        supabase.from('bills').select('id, total_amount').eq('user_id', user.id).gte('created_at', lastWeek).lt('created_at', today)
      ]);

      const inventory = inventoryRes.data;
      const patients = patientsRes.data;
      const bills = billsRes.data;
      const lastWeekBills = lastWeekBillsRes.data;

      const totalRevenue = bills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;
      const lastWeekRevenue = lastWeekBills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;
      const weeklyGrowth = lastWeekRevenue > 0 ? ((totalRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;
      const lowStock = inventory?.filter(item => item.quantity <= item.reorder_point).length || 0;

      setStats({
        totalInventory: inventory?.length || 0,
        totalPatients: patients?.length || 0,
        todaysBills: bills?.length || 0,
        todaysRevenue: totalRevenue,
        lowStockItems: lowStock,
        weeklyGrowth: Math.round(weeklyGrowth)
      });
      console.log('MobileDashboard: Dashboard stats fetched successfully.');
    } catch (error) {
      console.error("MobileDashboard: Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
      console.log('MobileDashboard: setIsLoading set to false.');
    }
  };

  const handleNavigation = async (path: string) => {
    await hapticFeedback('light');
    navigate(path);
  };

  const handleScannerResult = async (medicine: any) => {
    await processMedicine(medicine);
    await fetchDashboardStats();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickActions = [
    {
      title: "AI Scanner",
      subtitle: "Instant medicine detection",
      icon: Camera,
      gradient: "from-blue-500 to-purple-600",
      action: openScanner
    },
    {
      title: "New Bill",
      subtitle: "Create prescription",
      icon: Plus,
      gradient: "from-emerald-500 to-green-600",
      action: () => handleNavigation('/billing')
    },
    {
      title: "Inventory",
      subtitle: "Manage stock",
      icon: Package,
      gradient: "from-cyan-500 to-blue-500",
      action: () => handleNavigation('/mobile/inventory')
    },
    {
      title: "Patients",
      subtitle: "View records",
      icon: Users,
      gradient: "from-indigo-500 to-purple-500",
      action: () => handleNavigation('/mobile/patients')
    }
  ];

  const statCards = [
    {
      title: "Inventory",
      value: stats.totalInventory,
      icon: Package,
      color: "blue",
      change: null
    },
    {
      title: "Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "green",
      change: null
    },
    {
      title: "Today's Bills",
      value: stats.todaysBills,
      icon: FileText,
      color: "purple",
      change: null
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.todaysRevenue),
      icon: DollarSign,
      color: "emerald",
      change: stats.weeklyGrowth > 0 ? `+${stats.weeklyGrowth}%` : null
    }
  ];

  if (isLoading) {
    console.log('MobileDashboard: Displaying loading spinner.');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center safe-area-all">
        <div className="text-center animate-bounce-in">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse-apple"></div>
            <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <Sparkles className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>
          <p className="text-title-3 font-semibold text-gray-900 dark:text-white mb-2">Victure Healthcare</p>
          <p className="text-body text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 safe-area-all">
      <div className="max-w-md mx-auto animate-fade-in">
        {/* Apple-Style Status Bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 safe-area-top">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-footnote text-gray-600 dark:text-gray-400">{greeting}</p>
                <h1 className="text-title-1 font-bold text-gray-900 dark:text-white truncate">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Doctor'}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-caption-1 font-semibold text-gray-900 dark:text-white">
                    {formatTime(currentTime)}
                  </p>
                  <p className="text-caption-2 text-gray-600 dark:text-gray-400">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Button
                  onClick={() => handleNavigation('/mobile/settings')}
                  variant="ghost"
                  size="sm"
                  className="btn-apple focus-ring p-2 rounded-full w-10 h-10"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-32 space-y-8">
          {/* Hero Section - Apple Style */}
          <div className="space-y-6 pt-6 animate-slide-down">
            <div className="card-glass p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
              <div className="relative flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-title-2 font-bold text-gray-900 dark:text-white mb-1">
                    Welcome back! 👋
                  </h2>
                  <p className="text-footnote text-gray-600 dark:text-gray-400">
                    Ready to manage your pharmacy efficiently
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Apple Card Grid */}
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-title-2 font-bold text-gray-900 dark:text-white px-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={action.title}
                  onClick={async () => {
                    await hapticFeedback('light');
                    action.action();
                  }}
                  className={`btn-apple h-auto p-0 overflow-hidden focus-ring bg-gradient-to-br ${action.gradient} text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-full p-5 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <action.icon className="w-7 h-7" />
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </div>
                    <p className="text-subhead font-semibold mb-1">{action.title}</p>
                    <p className="text-caption-2 opacity-80">{action.subtitle}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Overview - Apple Style Cards */}
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-title-2 font-bold text-gray-900 dark:text-white">Overview</h3>
              <Button
                onClick={() => handleNavigation('/insights')}
                variant="ghost"
                size="sm"
                className="btn-apple focus-ring text-blue-600 dark:text-blue-400"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat, index) => (
                <div
                  key={stat.title}
                  className="card-apple p-5 animate-slide-up shadow-lg"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                      stat.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                      stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                      'bg-emerald-100 dark:bg-emerald-900'
                    }`}>
                      <stat.icon className={`w-6 h-6 ${
                        stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                        stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                        stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      }`} />
                    </div>
                    {stat.change && (
                      <div className="badge-apple badge-green">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </div>
                    )}
                  </div>
                  <p className="text-title-1 font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-caption-1 text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert - Apple Style */}
          {stats.lowStockItems > 0 && (
            <div className="card-apple border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-5 animate-bounce-in shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="text-callout font-semibold text-orange-900 dark:text-orange-100">
                    Low Stock Alert
                  </p>
                  <p className="text-footnote text-orange-700 dark:text-orange-300">
                    {stats.lowStockItems} items need restocking
                  </p>
                </div>
                <Button
                  onClick={() => handleNavigation('/mobile/inventory')}
                  size="sm"
                  className="btn-apple bg-orange-500 hover:bg-orange-600 text-white focus-ring shadow-lg"
                >
                  View
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Camera Scanner Modal */}
        {isScannerOpen && (
          <CameraScanner
            onScanComplete={handleScannerResult}
            onClose={closeScanner}
          />
        )}
      </div>
    </div>
  );
}

export default MobileDashboard;
