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
  Bell
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    console.log('MobileDashboard: useEffect triggered.');
    checkAuth();
    fetchDashboardStats();
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
    console.log('MobileDashboard: Fetching dashboard stats...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('MobileDashboard: No user found, cannot fetch stats.');
        return;
      }

      // Fetch inventory stats
      const { data: inventory, error: inventoryError } = await supabase
        .from("inventory")
        .select("id, quantity, reorder_point")
        .eq("user_id", user.id);
      if (inventoryError) console.error('MobileDashboard: Inventory fetch error:', inventoryError);

      // Fetch patients count
      const { data: patients, error: patientsError } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id);
      if (patientsError) console.error('MobileDashboard: Patients fetch error:', patientsError);

      // Fetch today's bills
      const today = new Date().toISOString().split('T')[0];
      const { data: bills, error: billsError } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("user_id", user.id)
        .gte("date", today + "T00:00:00")
        .lte("date", today + "T23:59:59");
      if (billsError) console.error('MobileDashboard: Bills fetch error:', billsError);

      // Fetch last week's bills for growth calculation
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { data: lastWeekBills, error: lastWeekBillsError } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("user_id", user.id)
        .gte("date", lastWeek.toISOString().split('T')[0] + "T00:00:00")
        .lte("date", today + "T23:59:59");
      if (lastWeekBillsError) console.error('MobileDashboard: Last week bills fetch error:', lastWeekBillsError);

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

  const handleSignOut = async () => {
    await hapticFeedback('medium');
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleScannerResult = async (medicine: any) => {
    await processMedicine(medicine);
    await fetchDashboardStats();
  };

  const quickActions = [
    {
      title: "Scan Medicine",
      subtitle: "AI-powered detection",
      icon: Camera,
      color: "bg-teal-500",
      action: openScanner
    },
    {
      title: "New Bill",
      subtitle: "Create prescription",
      icon: Plus,
      color: "bg-emerald-500",
      action: () => handleNavigation('/billing')
    },
    {
      title: "Inventory",
      subtitle: "Manage stock",
      icon: Package,
      color: "bg-cyan-500",
      action: () => handleNavigation('/mobile/inventory')
    },
    {
      title: "Patients",
      subtitle: "View records",
      icon: Users,
      color: "bg-blue-500",
      action: () => handleNavigation('/mobile/patients')
    }
  ];

  if (isLoading) {
    console.log('MobileDashboard: Displaying loading spinner.');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Teal Theme */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative p-6 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{greeting}!</h1>
              <p className="text-teal-100 text-sm font-medium">
                {user?.email?.split('@')[0] || 'Welcome back'}
              </p>
              <p className="text-teal-200 text-xs mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
                onClick={() => handleNavigation('/mobile/settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs font-medium">Today's Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.todaysRevenue.toLocaleString()}</p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs text-teal-200">+{stats.weeklyGrowth}% this week</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalInventory}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-teal-200">{stats.todaysBills} bills today</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="px-6 -mt-4 mb-6">
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-20 flex-col space-y-2 hover:bg-gray-50 border border-gray-100 rounded-xl"
                  onClick={action.action}
                >
                  <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-xs text-gray-900">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.subtitle}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Status */}
      <div className="px-6 space-y-4 mb-6">
        {stats.lowStockItems > 0 && (
          <Card className="border-l-4 border-l-amber-500 shadow-md bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">Low Stock Alert</p>
                    <p className="text-sm text-amber-700">{stats.lowStockItems} items need restocking</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-200 text-amber-800">
                  {stats.lowStockItems}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Summary Card */}
        <Card className="shadow-md bg-gradient-to-r from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Today's Summary</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.todaysBills} prescriptions • {stats.totalPatients} total patients
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('/insights')}
                className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation Hint */}
      <div className="px-6 pb-8">
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <Camera className="h-5 w-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-teal-900">Pro Tip</p>
              <p className="text-sm text-teal-700">Use AI scanning to quickly add medicines to your inventory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <CameraScanner
          onScanComplete={handleScannerResult}
          onClose={closeScanner}
        />
      )}
    </div>
  );
}

export default MobileDashboard;
