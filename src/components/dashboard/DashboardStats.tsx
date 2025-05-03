
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Revenue"
        value={`₹${totalRevenue.toLocaleString('en-IN')}`}
        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        trend={2.5}
        trendType="up"
      />
      <StatCard
        title="Inventory Value"
        value={`₹${totalInventoryValue.toLocaleString('en-IN')}`}
        icon={<ShoppingCart className="w-5 h-5 text-blue-600" />}
      />
      <StatCard
        title="Total Patients"
        value={totalPatients.toString()}
        icon={<Users className="w-5 h-5 text-indigo-600" />}
        trend={4.2}
        trendType="up"
      />
      <StatCard
        title="Low Stock Items"
        value={lowStockItems.toString()}
        icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
        trend={1.5}
        trendType="down"
      />
    </div>
  );
}
