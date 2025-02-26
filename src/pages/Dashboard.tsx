
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, FileText, AlertTriangle, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Dashboard() {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysBillCount, setTodaysBillCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    setupRealtimeSubscriptions();

    // Reset daily stats at 5:00 AM IST
    const now = new Date();
    const resetTime = new Date();
    resetTime.setHours(5, 0, 0, 0); // 5:00 AM IST
    if (now > resetTime) resetTime.setDate(resetTime.getDate() + 1);
    
    const timeUntilReset = resetTime.getTime() - now.getTime();
    const resetTimer = setTimeout(() => {
      fetchDashboardData();
    }, timeUntilReset);

    return () => {
      clearTimeout(resetTimer);
    };
  }, []);

  const fetchDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    // Fetch low stock items
    const { data: lowStock } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', session.user.id)
      .lt('quantity', 10);
    setLowStockCount(lowStock?.length || 0);

    // Fetch expiring items (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { data: expiring } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', session.user.id)
      .lt('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('expiry_date', new Date().toISOString());
    setExpiringCount(expiring?.length || 0);

    // Fetch today's sales and bill count
    const startOfDay = new Date();
    startOfDay.setHours(5, 0, 0, 0); // 5:00 AM IST
    const { data: todayBills } = await supabase
      .from('bills')
      .select('total_amount')
      .eq('user_id', session.user.id)
      .gte('date', startOfDay.toISOString());
    
    const totalSales = todayBills?.reduce((sum, bill) => sum + bill.total_amount, 0) || 0;
    setTodaysSales(totalSales);
    setTodaysBillCount(todayBills?.length || 0);

    // Fetch recent activity (bills and prescriptions)
    const { data: recentBills } = await supabase
      .from('bills')
      .select(`
        *,
        prescription:prescriptions (
          doctor_name,
          patient:patients (name)
        )
      `)
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .limit(5);
    
    setRecentActivity(recentBills || []);

    // Fetch inventory alerts
    const { data: alerts } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', session.user.id)
      .lt('quantity', 10)
      .order('quantity')
      .limit(5);
    
    setInventoryAlerts(alerts || []);
  };

  const setupRealtimeSubscriptions = () => {
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills'
        },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const stats = [
    {
      title: "Low Stock Items",
      value: lowStockCount.toString(),
      description: "Items need reordering",
      icon: Package,
      color: "text-red-500"
    },
    {
      title: "Today's Sales",
      value: `₹${todaysSales.toFixed(2)}`,
      description: "Since 5:00 AM IST",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "Bills Today",
      value: todaysBillCount.toString(),
      description: "Since 5:00 AM IST",
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "Expiring Items",
      value: expiringCount.toString(),
      description: "Within 30 days",
      icon: AlertTriangle,
      color: "text-yellow-500"
    }
  ];

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-neutral-900"
          >
            Welcome back
          </motion.h1>
          <p className="text-neutral-600 mt-2">Here's what's happening in your pharmacy today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-neutral-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-neutral-600 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Activity
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                      >
                        <div>
                          <p className="font-medium">Bill Generated</p>
                          <p className="text-sm text-neutral-600">
                            For {activity.prescription?.patient?.name} by Dr. {activity.prescription?.doctor_name}
                          </p>
                        </div>
                        <span className="text-sm text-neutral-600">
                          {format(new Date(activity.date), 'h:mm a')}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-600">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Inventory Alerts
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryAlerts.length > 0 ? (
                    inventoryAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                      >
                        <div>
                          <p className="font-medium">Low Stock Alert</p>
                          <p className="text-sm text-neutral-600">
                            {alert.name} - Current stock: {alert.quantity}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Reorder
                        </Button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-center text-neutral-600">Inventory levels are good</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
