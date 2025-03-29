
import { TrendingUp, BarChart2, PieChartIcon, Activity, Calendar, MapPin } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabsNavigation() {
  return (
    <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
      <TabsTrigger value="forecast" className="flex items-center">
        <TrendingUp className="w-4 h-4 mr-2" />
        Market Forecast
      </TabsTrigger>
      <TabsTrigger value="margin" className="flex items-center">
        <BarChart2 className="w-4 h-4 mr-2" />
        Margin Analysis
      </TabsTrigger>
      <TabsTrigger value="supplier" className="flex items-center">
        <PieChartIcon className="w-4 h-4 mr-2" />
        Supplier Metrics
      </TabsTrigger>
      <TabsTrigger value="expiry" className="flex items-center">
        <Activity className="w-4 h-4 mr-2" />
        Expiry Analysis
      </TabsTrigger>
      <TabsTrigger value="seasonal" className="flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        Seasonal Trends
      </TabsTrigger>
      <TabsTrigger value="regional" className="flex items-center">
        <MapPin className="w-4 h-4 mr-2" />
        Regional Demand
      </TabsTrigger>
    </TabsList>
  );
}
