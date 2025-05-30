
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "react-animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom'; // Import Link for navigation

export function DashboardStats({
  isLoading: propIsLoading,
  totalRevenue,
  totalInventoryValue,
  totalPatients,
  lowStockItems,
}) {
  const isLoading = propIsLoading;

  const formatCurrency = (value) => {
    return `₹ ${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const statCards = [
    {
      title: "Total Revenue",
      value: totalRevenue || 0,
      formattedValue: formatCurrency(totalRevenue || 0),
      icon: "₹",
      className: "",
    },
    {
      title: "Inventory Value",
      value: totalInventoryValue || 0,
      formattedValue: formatCurrency(totalInventoryValue || 0),
      icon: "₹",
      className: "",
    },
    {
      title: "Total Patients",
      value: Math.floor(totalPatients || 0),
      formattedValue: (totalPatients || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      icon: "👤",
      className: "",
    },
    {
      title: "Low Stock Items",
      value: Math.floor(lowStockItems || 0),
      formattedValue: `${Math.floor(lowStockItems || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} items`,
      icon: "⚠️",
      className: "cursor-pointer hover:bg-gray-50", // Add cursor-pointer and hover effect
      link: "/inventory?filter=low-stock", // Example link to low stock items
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-50">
      {statCards.map((card, index) => {
        const CardWrapper = card.link ? Link : 'div';
        return (
          <CardWrapper
            key={index}
            to={card.link || '#'}
            className={cn(
              "bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300",
              card.className,
              card.link ? "block" : ""
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-3/4" />
              ) : (
                <div className="text-4xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">
                  {card.title === "Total Revenue" || card.title === "Inventory Value" || card.title === "Total Patients" ? (
                    card.formattedValue
                  ) : (
                    <AnimatedCounter value={card.value} />
                  )}
                  {card.title === "Low Stock Items" && card.formattedValue}
                </div>
              )}
            </CardContent>
          </CardWrapper>
        );
      })}
    </div>
  );
}
