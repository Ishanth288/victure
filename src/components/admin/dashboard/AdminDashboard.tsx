import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button for actions
import { Users, ShoppingBag, AlertCircle, UserCheck, DollarSign, MessageSquareWarning, List, Settings, BarChart } from "lucide-react"; // Added more icons
import { StatsCard } from "@/components/insights/StatsCard"; // Assuming this component exists and works

// --- Interface Enhancement ---
// Added new fields for more stats
interface AdminStats {
  total_users: number;
  total_products: number;
  feedback_count: number;
  active_users: number;
  total_revenue?: number; // Optional: Example for Revenue
  open_tickets?: number; // Optional: Example for Support Tickets
  // Add other relevant stats as needed
}

interface AdminDashboardProps {
  stats: AdminStats;
  isLoading: boolean; // Loading state for stats
  // Consider adding isLoadingSystemStatus if status is fetched separately
}

// --- Mock Data Example (Replace with actual data fetching) ---
const recentActivities = [
  { id: 1, type: "user", description: "New user registered: john.doe@example.com", time: "5m ago" },
  { id: 2, type: "order", description: "Order #1234 placed successfully.", time: "15m ago" },
  { id: 3, type: "feedback", description: "New feedback submitted.", time: "1h ago" },
  { id: 4, type: "system", description: "System maintenance scheduled for 2 AM.", time: "3h ago" },
];
// --- End Mock Data Example ---


export function AdminDashboard({ stats, isLoading }: AdminDashboardProps) {
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getStatusComponent = (status: string | undefined) => {
    // Placeholder: Fetch actual status dynamically
    // Based on fetched status, return appropriate text/color
    if (status === undefined) return <span className="text-sm text-gray-500">Checking...</span>;
    if (status === "Operational") return <span className="text-sm font-medium text-green-600">{status}</span>;
    if (status === "Degraded") return <span className="text-sm font-medium text-yellow-600">{status}</span>;
    return <span className="text-sm font-medium text-red-600">{status || "Error"}</span>;
  };

  // Placeholder for actual last check time from monitoring service
  const lastCheckTime = stats.lastSystemCheckTime || new Date().toLocaleString(); // Use fetched time if available

  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added padding */}
      {/* === Stats Grid === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"> {/* Adjusted grid for 6 cards */}
        <StatsCard
          title="Total Users"
          value={stats.total_users}
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="All registered users"
          trend="neutral"
        />
        <StatsCard
          title="Active Users (24h)" // Clarified timeframe
          value={stats.active_users}
          icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="Users active recently"
          trend="up" // Example trend
        />
        <StatsCard
          title="Total Products"
          value={stats.total_products}
          icon={<ShoppingBag className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="Products in inventory"
          trend="neutral"
        />
         {/* --- New Stat Card Examples --- */}
        <StatsCard
          title="Total Revenue (Month)" // Example: Revenue
          value={formatCurrency(stats.total_revenue)} // Use formatter
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="Revenue this month"
          trend="up"
        />
        <StatsCard
          title="Open Tickets" // Example: Support Tickets
          value={stats.open_tickets ?? 'N/A'} // Handle undefined
          icon={<MessageSquareWarning className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="Pending support requests"
          trend={stats.open_tickets && stats.open_tickets > 10 ? "down" : "neutral"} // Example conditional trend
        />
         <StatsCard
          title="Feedback Items"
          value={stats.feedback_count}
          icon={<AlertCircle className="h-5 w-5 text-muted-foreground" />}
          loading={isLoading}
          description="User submitted feedback"
          trend="neutral"
        />
         {/* --- End New Stat Card Examples --- */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* === Recent Activity Section === */}
         <Card className="lg:col-span-2">
           <CardHeader>
             <CardTitle>Recent Activity</CardTitle>
             <CardDescription>
               Latest events happening in the system.
             </CardDescription>
           </CardHeader>
           <CardContent>
             {/* Placeholder: Replace with actual activity data and potentially pagination */}
             {isLoading ? (
                <div className="text-center p-4 text-muted-foreground">Loading activities...</div>
             ) : recentActivities.length > 0 ? (
               <ul className="space-y-3">
                 {recentActivities.slice(0, 5).map((activity) => ( // Show latest 5
                   <li key={activity.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0">
                     <span>{activity.description}</span>
                     <span className="text-xs text-muted-foreground">{activity.time}</span>
                   </li>
                 ))}
               </ul>
             ) : (
                <div className="text-center p-4 text-muted-foreground">No recent activity.</div>
             )}
           </CardContent>
         </Card>

         {/* === System Status & Quick Actions Column === */}
         <div className="space-y-6 lg:col-span-1">
            {/* === System Status Card === */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Overall system health overview.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder: Replace statuses with dynamically fetched data */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database</span>
                    {getStatusComponent(isLoading ? undefined : "Operational")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Service</span>
                     {getStatusComponent(isLoading ? undefined : "Operational")}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                     {getStatusComponent(isLoading ? undefined : "Degraded")} {/* Example status */}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 mt-2">
                    <span className="text-sm font-medium">Last Check</span>
                    {/* Ideally, this timestamp comes from your monitoring service */}
                    <span className="text-sm text-muted-foreground">{isLoading ? 'N/A' : lastCheckTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* === Quick Actions Card === */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-2">
                {/* Placeholder: Link these buttons to actual admin functionalities */}
                <Button variant="outline" size="sm" className="justify-start">
                  <Users className="mr-2 h-4 w-4" /> Manage Users
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Manage Products
                </Button>
                 <Button variant="outline" size="sm" className="justify-start">
                  <AlertCircle className="mr-2 h-4 w-4" /> View Feedback
                </Button>
                 <Button variant="outline" size="sm" className="justify-start">
                  <BarChart className="mr-2 h-4 w-4" /> View Reports
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" /> System Settings
                </Button>
              </CardContent>
            </Card>
         </div>
      </div>

       {/* Add more sections/cards as needed, e.g., charts, detailed tables */}

    </div>
  );
}

// Make sure the StatsCard component handles the 'loading' prop appropriately
// (e.g., showing skeletons or placeholders) and displays the trend indicator.