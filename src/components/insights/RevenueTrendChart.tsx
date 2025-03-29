
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface RevenueTrendChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

export function RevenueTrendChart({ data, timeframe = 'month' }: RevenueTrendChartProps) {
  // Format labels based on timeframe
  const formatXAxis = (value: string) => {
    if (timeframe === 'day') {
      return `${value}`;
    } else if (timeframe === 'week') {
      return value;
    } else if (timeframe === 'month') {
      return `${value}`;
    } else if (timeframe === 'year') {
      return value;
    }
    return value;
  };
  
  // Create a stable and simplified dataset with visual improvements
  const stableData = data.map(item => ({
    ...item,
    // Format large numbers for easier reading
    value: Math.round(item.value) // Round values for cleaner presentation
  }));

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={stableData}
            margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis 
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              tick={{ fill: '#666', fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
              tick={{ fill: '#666', fontSize: 12 }}
              tickMargin={10}
            />
            <Tooltip
              formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => {
                if (timeframe === 'day') {
                  return `Hour: ${label}`;
                } else if (timeframe === 'week') {
                  return `${label}`;
                } else if (timeframe === 'month') {
                  return `Day ${label}`;
                } else if (timeframe === 'year') {
                  return `${label}`;
                }
                return label;
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" // Changed to indigo color for better visibility
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
              animationDuration={300} // Reduced animation duration to prevent flickering
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
