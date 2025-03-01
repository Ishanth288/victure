
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
  // Transform data to ensure it has a value property and it's a number
  const chartData = data.map(item => ({
    ...item,
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
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis 
                dataKey="name" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
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
              />
              <Bar 
                dataKey="value" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
