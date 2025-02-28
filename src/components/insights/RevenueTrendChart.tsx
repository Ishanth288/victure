
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis 
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              formatter={(value: any) => [`₹${value}`, 'Revenue']}
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
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
