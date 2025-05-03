
import { StatCard } from "@/components/insights/StatCard";
import { TrendingUp, ShoppingCart, Users, AlertCircle } from "lucide-react";

interface DashboardStatsProps {
  totalRevenue: number;
  totalInventoryValue: number;
  totalPatients: number;
  lowStockItems: number;
}

export function DashboardStats({ 
  totalRevenue, 
  totalInventoryValue, 
  totalPatients, 
  lowStockItems 
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Revenue"
        value={`₹${totalRevenue.toLocaleString('en-IN')}`}
        icon={TrendingUp}
        trend={2.5}
      />
      <StatCard
        title="Inventory Value"
        value={`₹${totalInventoryValue.toLocaleString('en-IN')}`}
        icon={ShoppingCart}
      />
      <StatCard
        title="Total Patients"
        value={totalPatients}
        icon={Users}
        trend={4.2}
      />
      <StatCard
        title="Low Stock Items"
        value={lowStockItems}
        icon={AlertCircle}
        trend={-1.5}
      />
    </div>
  );
}
