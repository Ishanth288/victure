
import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMobileScanner } from "@/hooks/useMobileScanner";
import { CameraScanner } from "./CameraScanner";
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
  ShoppingCart,
  User,
  LogOut,
  Plus
} from "lucide-react";
import { hapticFeedback } from "@/utils/mobileUtils";

interface DashboardStats {
  totalInventory: number;
  totalPatients: number;
  todaysBills: number;
  todaysRevenue: number;
  lowStockItems: number;
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
    lowStockItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchDashboardStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch inventory stats
      const { data: inventory } = await supabase
        .from("inventory")
        .select("id, quantity, reorder_point")
        .eq("user_id", user.id);

      // Fetch patients count
      const { data: patients } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id);

      // Fetch today's bills
      const today = new Date().toISOString().split('T')[0];
      const { data: bills } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("user_id", user.id)
        .gte("date", today + "T00:00:00")
        .lte("date", today + "T23:59:59");

      const totalRevenue = bills?.reduce((sum, bill) => sum + Number(bill.total_amount), 0) || 0;
      const lowStock = inventory?.filter(item => item.quantity <= item.reorder_point).length || 0;

      setStats({
        totalInventory: inventory?.length || 0,
        totalPatients: patients?.length || 0,
        todaysBills: bills?.length || 0,
        todaysRevenue: totalRevenue,
        lowStockItems: lowStock
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setIsLoading(false);
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
    await fetchDashboardStats(); // Refresh stats after adding item
  };

  const quickActions = [
    {
      title: "Scan Medicine",
      subtitle: "Add to inventory",
      icon: Camera,
      color: "bg-blue-500",
      action: openScanner
    },
    {
      title: "New Prescription",
      subtitle: "Create billing",
      icon: Plus,
      color: "bg-green-500",
      action: () => handleNavigation('/billing')
    },
    {
      title: "View Inventory",
      subtitle: "Manage stock",
      icon: Package,
      color: "bg-purple-500",
      action: () => handleNavigation('/mobile/inventory')
    },
    {
      title: "Patient Records",
      subtitle: "View patients",
      icon: Users,
      color: "bg-orange-500",
      action: () => handleNavigation('/mobile/patients')
    }
  ];

  const menuItems = [
    { title: "Inventory", icon: Package, path: "/mobile/inventory" },
    { title: "Billing", icon: DollarSign, path: "/billing" },
    { title: "Prescriptions", icon: FileText, path: "/prescriptions" },
    { title: "Patients", icon: Users, path: "/mobile/patients" },
    { title: "Analytics", icon: BarChart3, path: "/insights" },
    { title: "Settings", icon: Settings, path: "/mobile/settings" }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good morning!</h1>
            <p className="text-blue-100">{user?.email || 'Welcome back'}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-white hover:bg-white/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Inventory Items</p>
                <p className="text-2xl font-bold">{stats.totalInventory}</p>
              </div>
              <Package className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Revenue</p>
                <p className="text-2xl font-bold">₹{stats.todaysRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-8 mb-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-20 flex-col space-y-2 hover:bg-gray-50"
                  onClick={action.action}
                >
                  <div className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-xs">{action.title}</p>
                    <p className="text-xs text-gray-500">{action.subtitle}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="px-6 space-y-4 mb-6">
        {stats.lowStockItems > 0 && (
          <Card className="border-l-4 border-l-red-500 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-800">Low Stock Alert</p>
                  <p className="text-sm text-red-600">{stats.lowStockItems} items need restocking</p>
                </div>
                <Badge variant="destructive">{stats.lowStockItems}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Today's Activity</p>
                <p className="text-sm text-gray-600">{stats.todaysBills} bills processed</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">₹{stats.todaysRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Menu */}
      <div className="px-6">
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-lg">Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {menuItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-16 flex-col space-y-1 hover:bg-gray-50"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-6 w-6 text-gray-600" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <CameraScanner
          onMedicineDetected={handleScannerResult}
          onClose={closeScanner}
        />
      )}
    </div>
  );
}
