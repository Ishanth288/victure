
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "react-animated-counter";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats({
  isLoading: propIsLoading,
  totalRevenue,
  totalInventoryValue,
  totalPatients,
  lowStockItems,
}) {
  const isLoading = propIsLoading;

  const statCards = [
    {
      title: "Total Revenue",
      value: totalRevenue || 0,
      icon: "₹",
      className: "",
    },
    {
      title: "Inventory Value",
      value: totalInventoryValue || 0,
      icon: "₹",
      className: "",
    },
    {
      title: "Total Patients",
      value: Math.floor(totalPatients || 0),
      icon: "👤",
      className: "",
    },
    {
      title: "Low Stock Items",
      value: Math.floor(lowStockItems || 0),
      icon: "⚠️",
      className: "",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-50">
      {statCards.map((card, index) => (
        <Card key={index} className={cn("bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300", card.className)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <span className="text-2xl">{card.icon}</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-3/4" />
            ) : (
              <div className="text-4xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
                <AnimatedCounter value={card.value} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
