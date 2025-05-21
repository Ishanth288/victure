
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ArrowRight, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendType?: 'positive' | 'negative' | 'neutral';
  tooltip?: string;
}

export function StatCard({ title, value, icon: Icon, trend = 0, trendType, tooltip }: StatCardProps) {
  // Calculate trend display and handle invalid values
  const calculateTrendDisplay = () => {
    // Check if trend is a valid number
    if (typeof trend !== 'number' || isNaN(trend)) {
      return {
        color: 'text-gray-500',
        icon: <ArrowRight className="w-4 h-4" />,
        value: '--'
      };
    }
    
    // Determine trend color and icon based on type or value
    if (trendType === 'positive' || (trendType === undefined && trend > 0)) {
      return {
        color: 'text-green-500',
        icon: <ArrowUpRight className="w-4 h-4" />,
        value: `${Math.abs(trend).toFixed(1)}%`
      };
    } else if (trendType === 'negative' || (trendType === undefined && trend < 0)) {
      return {
        color: 'text-red-500',
        icon: <ArrowDownRight className="w-4 h-4" />,
        value: `${Math.abs(trend).toFixed(1)}%`
      };
    }
    
    return {
      color: 'text-gray-500',
      icon: <ArrowRight className="w-4 h-4" />,
      value: `${Math.abs(trend).toFixed(1)}%`
    };
  };
  
  const trendDisplay = calculateTrendDisplay();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center">
            {trend !== 0 && (
              <div className={`flex items-center ${trendDisplay.color}`}>
                {trendDisplay.icon}
                <span className="text-sm font-medium">{trendDisplay.value}</span>
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
