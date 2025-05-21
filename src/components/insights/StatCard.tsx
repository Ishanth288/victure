
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendType?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export function StatCard({ title, value, icon: Icon, trend = 0, trendType, tooltip }: StatCardProps) {
  // Determine trend color and icon based on type or value
  const getTrendColor = () => {
    if (trendType === 'positive' || (trendType === undefined && trend > 0)) {
      return 'text-green-500';
    } else if (trendType === 'negative' || (trendType === undefined && trend < 0)) {
      return 'text-red-500';
    }
    return 'text-gray-500';
  };

  const TrendIcon = () => {
    if (trendType === 'positive' || (trendType === undefined && trend > 0)) {
      return <ArrowUpRight className="w-4 h-4" />;
    } else if (trendType === 'negative' || (trendType === undefined && trend < 0)) {
      return <ArrowDownRight className="w-4 h-4" />;
    }
    return <ArrowRight className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center">
            {trend !== 0 && (
              <div className={`flex items-center ${getTrendColor()}`}>
                <TrendIcon />
                <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
              </div>
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-1 cursor-help">
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </CardContent>
    </Card>
  );
}
