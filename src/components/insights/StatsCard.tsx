
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: ReactNode;
  description: string;
  trend: "up" | "down" | "neutral";
}

export function StatsCard({ title, value, suffix = "", icon, description, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-2xl font-bold mb-1">
            {value.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
              minimumFractionDigits: 0,
            })}
            {suffix}
          </div>
          <div className="flex items-center text-xs">
            {trend === "up" ? (
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            ) : trend === "down" ? (
              <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
            ) : null}
            <span
              className={
                trend === "up"
                  ? "text-green-500"
                  : trend === "down"
                  ? "text-red-500"
                  : "text-muted-foreground"
              }
            >
              {description}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
