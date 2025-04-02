
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

interface RevenueTrendChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

// Using memo to prevent unnecessary re-renders
export const RevenueTrendChart = memo(({ data, timeframe = 'month' }: RevenueTrendChartProps) => {
  // Format labels based on timeframe
  const formatXAxis = (value: string) => {
    return value;
  };
  
  // Using stable object structure to prevent constant recalculation
  const stableData = data.map(item => ({
    name: item.name,
    value: Math.round(item.value),
    industryAverage: Math.round(item.value * 0.85) // Simplified calculation
  }));

  // Precompute the domain for YAxis to prevent flickering
  const maxValue = Math.max(...stableData.map(item => item.value)) * 1.1;
  const minValue = 0;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={stableData}
            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
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
              // Ensure enough space for labels
              height={50} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${Math.floor(value/1000)}k`}
              tick={{ fill: '#666', fontSize: 12 }}
              tickMargin={10}
              width={65}
              domain={[minValue, maxValue]} // Fixed domain to prevent recalculation
              // Ensure enough space for labels
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip
              formatter={(value: any) => [`₹${value.toLocaleString()}`, '']}
              labelFormatter={(label) => {
                if (timeframe === 'day') return `Hour: ${label}`;
                if (timeframe === 'week') return `${label}`;
                if (timeframe === 'month') return `Day ${label}`;
                if (timeframe === 'year') return `${label}`;
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
            <Legend 
              align="right"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: '10px' }} 
              formatter={(value) => (
                <span style={{ 
                  color: value === "Your Pharmacy" ? "#6366f1" : "#65a30d", 
                  fontSize: "12px" 
                }}>
                  {value}
                </span>
              )}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              name="Your Pharmacy" 
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
              isAnimationActive={false} // Disable animation for better performance
            />
            <Line 
              type="monotone" 
              dataKey="industryAverage" 
              name="Industry Average" 
              stroke="#65a30d"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, strokeWidth: 2, fill: 'white' }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              isAnimationActive={false} // Disable animation for better performance
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

RevenueTrendChart.displayName = 'RevenueTrendChart';
