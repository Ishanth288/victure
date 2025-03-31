
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Line,
  ComposedChart
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  reorder_point: number;
  unit_cost: number;
  selling_price: number;
  projected_demand?: number;
  days_until_stockout?: number;
  status?: 'Low' | 'Ok' | 'Critical';
}

interface InventoryForecastChartProps {
  inventoryData: InventoryItem[];
  salesData?: any[];
}

export function InventoryForecastChart({ inventoryData, salesData = [] }: InventoryForecastChartProps) {
  const [sortBy, setSortBy] = useState<"quantity" | "demand" | "stockout">("stockout");
  const [displayCount, setDisplayCount] = useState<number>(10);

  // Process and calculate projected demand based on sales data (if available)
  const processedData = useMemo(() => {
    return inventoryData.map(item => {
      // Simple demand projection (in real app, this would use actual sales data)
      const randomFactor = 0.5 + Math.random();
      const projectedDemand = Math.max(5, Math.floor(item.reorder_point * randomFactor));
      const daysUntilStockout = item.quantity > 0 ? 
        Math.ceil(item.quantity / (projectedDemand / 30)) : 0;
      
      // Determine status based on stock levels
      let status: 'Low' | 'Ok' | 'Critical';
      if (item.quantity <= 0) {
        status = 'Critical';
      } else if (item.quantity < item.reorder_point) {
        status = 'Low';
      } else {
        status = 'Ok';
      }
      
      return {
        ...item,
        projected_demand: projectedDemand,
        days_until_stockout: daysUntilStockout,
        status
      };
    });
  }, [inventoryData]);
  
  // Sort and limit data based on user selection
  const chartData = useMemo(() => {
    const sortedData = [...processedData];
    
    if (sortBy === "quantity") {
      sortedData.sort((a, b) => a.quantity - b.quantity);
    } else if (sortBy === "demand") {
      sortedData.sort((a, b) => (b.projected_demand || 0) - (a.projected_demand || 0));
    } else {
      // Sort by days until stockout (ascending)
      sortedData.sort((a, b) => {
        // Items already out of stock go to the top
        if (a.quantity <= 0 && b.quantity > 0) return -1;
        if (b.quantity <= 0 && a.quantity > 0) return 1;
        // Then sort by days until stockout
        return (a.days_until_stockout || 999) - (b.days_until_stockout || 999);
      });
    }
    
    // Take only the specified number of items
    return sortedData.slice(0, displayCount);
  }, [processedData, sortBy, displayCount]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const outOfStock = processedData.filter(item => item.quantity <= 0).length;
    const lowStock = processedData.filter(item => item.quantity > 0 && item.quantity < item.reorder_point).length;
    const criticalItems = processedData.filter(item => (item.days_until_stockout || 999) < 7).length;
    
    return { outOfStock, lowStock, criticalItems };
  }, [processedData]);
  
  // Format labels and tooltips
  const formatTooltip = (value: number, name: string, props: any) => {
    switch (name) {
      case "quantity":
        return [`${value} units`, "Current Stock"];
      case "projected_demand":
        return [`${value} units/month`, "Projected Demand"];
      case "reorder_point":
        return [`${value} units`, "Reorder Point"];
      default:
        return [value, name];
    }
  };

  // Function to determine bar color based on item status
  const getBarFill = (entry: any) => {
    if (entry.status === 'Critical') return "#ef4444";
    if (entry.status === 'Low') return "#eab308";
    return "#22c55e";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle>Inventory Forecast</CardTitle>
            <CardDescription>Stock levels and projected demand</CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={(value: "quantity" | "demand" | "stockout") => setSortBy(value)}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stockout">Days to Stockout</SelectItem>
                <SelectItem value="quantity">Stock Level</SelectItem>
                <SelectItem value="demand">Projected Demand</SelectItem>
              </SelectContent>
            </Select>
            <Select value={displayCount.toString()} onValueChange={(value) => setDisplayCount(parseInt(value))}>
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue placeholder="Show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Inventory Status Summary */}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant={summaryStats.outOfStock > 0 ? "destructive" : "outline"} className="text-xs">
            {summaryStats.outOfStock} Out of Stock
          </Badge>
          <Badge variant={summaryStats.lowStock > 0 ? "warning" : "outline"} className="text-xs bg-yellow-600">
            {summaryStats.lowStock} Low Stock
          </Badge>
          <Badge variant={summaryStats.criticalItems > 0 ? "destructive" : "outline"} className="text-xs">
            {summaryStats.criticalItems} Critical (&lt; 7 days)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 'auto']}
              tickFormatter={(value) => `${value}`} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={100}
              tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
            />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            <Bar 
              dataKey="quantity" 
              name="Current Stock"
              fill="#22c55e"
              stroke="#22c55e" // Fixed: Using a string value instead of a function
              radius={[0, 4, 4, 0]}
            />
            <Bar 
              dataKey="reorder_point" 
              name="Reorder Point" 
              fill="#94a3b8" 
              opacity={0.6}
              radius={[0, 4, 4, 0]}
            />
            <Line
              type="monotone"
              dataKey="projected_demand"
              name="Projected Demand"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: "#8884d8", r: 4 }}
              activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
