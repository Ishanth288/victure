
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
              right: 20, // Increased right margin for labels
              left: 0,
              bottom: 20, // Increased bottom margin for labels
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
              height={50} // Ensure enough space for X-axis labels
              interval="preserveStartEnd" // Ensure first and last labels always show
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₹${value}`}
              width={60} // Fixed width for Y-axis to prevent overflow
              tickCount={5} // Limit the number of ticks to prevent crowding
              domain={['auto', 'auto']}
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip
              formatter={(value: any) => [`₹${value}`, 'Revenue']}
              labelFormatter={(dateStr) => {
                const date = parseISO(dateStr);
                return format(date, "MMMM d, yyyy");
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.2} 
              isAnimationActive={false} // Disable animation for better performance
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
