
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendType?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend = 0, 
  trendType = "neutral",
  className = ""
}: StatCardProps) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          </div>
          
          {trend !== 0 && (
            <div className={`flex items-center ${
              trendType === "up" ? "text-green-600" : 
              trendType === "down" ? "text-red-600" : ""
            }`}>
              {trendType === "up" ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : trendType === "down" ? (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              ) : null}
              <span className="text-sm font-medium">
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <h2 className="text-3xl font-bold text-gray-800">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
