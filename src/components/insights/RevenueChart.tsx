
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface RevenueChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-[300px]">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          No revenue data available for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              tickFormatter={(dateStr) => {
                const date = parseISO(dateStr);
                return format(date, "MMM dd");
              }}
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
              labelFormatter={(dateStr) => {
                const date = parseISO(dateStr);
                return format(date, "MMMM d, yyyy");
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.2} 
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
