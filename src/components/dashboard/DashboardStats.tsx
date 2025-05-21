
import { StatCard } from "@/components/insights/StatCard";
import { TrendingUp, ShoppingCart, Users, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [animatedRevenue, setAnimatedRevenue] = useState(0);
  const [animatedInventoryValue, setAnimatedInventoryValue] = useState(0);
  const [animatedPatients, setAnimatedPatients] = useState(0);
  const [animatedLowStock, setAnimatedLowStock] = useState(0);
  
  // Animate the counters on load
  useEffect(() => {
    const duration = 1000; // Animation duration in ms
    const steps = 20; // Number of steps in animation
    const interval = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedRevenue(Math.round(totalRevenue * progress));
      setAnimatedInventoryValue(Math.round(totalInventoryValue * progress));
      setAnimatedPatients(Math.round(totalPatients * progress));
      setAnimatedLowStock(Math.round(lowStockItems * progress));
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedRevenue(totalRevenue);
        setAnimatedInventoryValue(totalInventoryValue);
        setAnimatedPatients(totalPatients);
        setAnimatedLowStock(lowStockItems);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [totalRevenue, totalInventoryValue, totalPatients, lowStockItems]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Revenue"
        value={`₹${animatedRevenue.toLocaleString('en-IN')}`}
        icon={TrendingUp}
        trend={2.5}
        trendType="positive"
        tooltip="Total revenue generated from all sales"
      />
      <StatCard
        title="Inventory Value"
        value={`₹${animatedInventoryValue.toLocaleString('en-IN')}`}
        icon={ShoppingCart}
        tooltip="Current value of all inventory items"
      />
      <StatCard
        title="Total Patients"
        value={animatedPatients}
        icon={Users}
        trend={4.2}
        trendType="positive"
        tooltip="Total number of registered patients"
      />
      <StatCard
        title="Low Stock Items"
        value={animatedLowStock}
        icon={AlertCircle}
        trend={lowStockItems > 0 ? -1.5 : 0}
        trendType={lowStockItems > 0 ? "negative" : "neutral"}
        tooltip="Items that need to be reordered soon"
      />
    </div>
  );
}
