
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, AlertCircle, UserCheck } from "lucide-react";
import { StatsCard } from "@/components/insights/StatsCard";

interface AdminStats {
  total_users: number;
  total_products: number;
  feedback_count: number;
  active_users: number;
}

interface AdminDashboardProps {
  stats: AdminStats;
  isLoading: boolean;
}

export function AdminDashboard({ stats, isLoading }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}
