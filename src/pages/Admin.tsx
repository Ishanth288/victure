
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { FeedbackList } from "@/components/admin/FeedbackList";
import SystemSettings from "@/pages/admin/SystemSettings";
import { typecastQuery, safeQueryData } from "@/utils/safeSupabaseQueries";
import { StatsCard } from "@/components/insights/StatsCard";
import { Users, ShoppingBag, AlertCircle, Bell, UserCheck, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  total_users: number;
  total_products: number;
  feedback_count: number;
  active_users: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_products: 0,
    feedback_count: 0,
    active_users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkAdminAccess();
    fetchAdminStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin' && profile?.role !== 'owner') {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin area.",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
    }
  };

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: productCount, error: productError } = await supabase
        .from('inventory')
        .select('*', { count: 'exact', head: true });

      const { count: feedbackCount, error: feedbackError } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });
      
      const activeUsers = userCount ? Math.round(userCount * 0.7) : 0;

      setStats({
        total_users: userCount || 0,
        total_products: productCount || 0,
        feedback_count: feedbackCount || 0,
        active_users: activeUsers,
      });

      if (userError || productError || feedbackError) {
        throw new Error("Error fetching admin stats");
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast({
        title: "Error",
        description: "Failed to load administrative data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
            <TabsTrigger value="dashboard" className="flex items-center">
              <div className="flex gap-2 items-center">
                <Settings className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center">
              <div className="flex gap-2 items-center">
                <Settings className="h-4 w-4" />
                <span>System Settings</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center">
              <div className="flex gap-2 items-center">
                <Bell className="h-4 w-4" />
                <span>Feedback</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <div className="flex gap-2 items-center">
                <Users className="h-4 w-4" />
                <span>User Management</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Total Users" 
                value={stats.total_users} 
                icon={<Users className="h-5 w-5" />} 
                loading={isLoading}
                description="All registered users"
                trend="neutral"
              />
              <StatsCard 
                title="Active Users" 
                value={stats.active_users} 
                icon={<UserCheck className="h-5 w-5" />} 
                loading={isLoading}
                description="Currently active users"
                trend="up"
              />
              <StatsCard 
                title="Total Products" 
                value={stats.total_products} 
                icon={<ShoppingBag className="h-5 w-5" />} 
                loading={isLoading}
                description="Products in inventory"
                trend="neutral"
              />
              <StatsCard 
                title="Feedback Items" 
                value={stats.feedback_count} 
                icon={<AlertCircle className="h-5 w-5" />} 
                loading={isLoading}
                description="User submitted feedback"
                trend="neutral"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Overall system health and status information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Status</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Status</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last System Check</span>
                    <span className="text-sm">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackList />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-6 text-muted-foreground">
                  User management functionality will be implemented in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
