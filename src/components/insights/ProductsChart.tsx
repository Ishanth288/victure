
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProductsChartProps {
  data: Array<{
    id?: number;
    name: string;
    quantity?: number;
    revenue?: number;
    value?: number | string;
  }>;
}

export function ProductsChart({ data }: ProductsChartProps) {
  // Format currency values for better readability
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₹${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    } else {
      return `₹${value}`;
    }
  };

  // Transform data to ensure it has a value property and it's a number
  const chartData = data.map(item => ({
    ...item,
    name: item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name, // Truncate long names
    value: item.value !== undefined 
      ? (typeof item.value === 'string' ? Number(item.value) : item.value)
      : (item.revenue !== undefined ? Number(item.revenue) : 0)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No product data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 10,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="name" 
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                height={60}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value)}
                width={60}
                domain={[0, 'dataMax + 500']}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
