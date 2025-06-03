
import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataItem {
  name: string;
  value: number;
}

interface ForecastDataItem extends DataItem {
  forecast?: number;
}

interface RevenueTrendChartProps {
  data: Array<DataItem>;
  timeframe?: 'day' | 'week' | 'month' | 'year';
}

// Generate sample data function
const generateSampleData = (days: number): DataItem[] => {
  const data: DataItem[] = [];
  for (let i = 0; i < days; i++) {
    data.push({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 10000) + 5000
    });
  }
  return data;
};

// Using memo to prevent unnecessary re-renders
export const RevenueTrendChart = memo(({ data, timeframe = 'month' }: RevenueTrendChartProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>(timeframe === 'day' ? 'week' : timeframe);
  
  // Check if data is empty or invalid
  if (!data || data.length === 0) {
    data = generateSampleData(30); // Generate sample data if no real data
  }
  
  // Calculate values
  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);
  const average = totalRevenue / data.length;
  const trend = data.length > 1 ? 
    (data[data.length - 1].value - data[0].value) / data.length : 0;
  
  // Create forecast data
  const extendedData: ForecastDataItem[] = [...data];
  const forecastPeriod = selectedTimeframe === 'week' ? 7 : 
                       selectedTimeframe === 'month' ? 30 : 90;
  
  // Simple forecast based on trend
  for (let i = 1; i <= Math.min(forecastPeriod, 30); i++) {
    const lastValue = extendedData[extendedData.length - 1].value;
    const forecastValue = lastValue + trend * (1 + (i % 10) / 10); // Add some variation
    extendedData.push({
      name: `Forecast ${i}`,
      value: 0, // No actual value
      forecast: Math.max(0, Math.round(forecastValue)),
    });
  }
  
  // Calculate forecast total
  const forecastTotal = extendedData
    .filter(item => item.forecast)
    .reduce((sum, item) => sum + (item.forecast || 0), 0);
  
  // Format labels based on timeframe
  const formatXAxis = (value: string) => {
    if (value.startsWith('Forecast')) return '';
    return value;
  };
  
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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Revenue Forecast</CardTitle>
            <CardDescription>Actual and projected revenue trends</CardDescription>
          </div>
          <Select value={selectedTimeframe} onValueChange={(value: 'week' | 'month' | 'year') => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* KPI Summary */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-md">
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</div>
            <div className="font-bold">₹{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md">
            <div className="text-xs text-gray-600 dark:text-gray-400">Daily Average</div>
            <div className="font-bold">₹{average.toFixed(0).toLocaleString()}</div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-md">
            <div className="text-xs text-gray-600 dark:text-gray-400">Forecast ({selectedTimeframe})</div>
            <div className="font-bold">₹{forecastTotal.toLocaleString()}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[320px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={extendedData}
            margin={{ top: 20, right: 30, left: 30, bottom: 50 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatXAxis}
              tick={{ fill: '#666', fontSize: 11 }}
              tickMargin={10}
              height={60}
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
              tickCount={5}
              domain={['auto', 'dataMax + 1000']}
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip
              formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(label) => {
                return label.startsWith('Forecast') ? `Forecast (${label.split(' ')[1]} ${selectedTimeframe === 'week' ? 'day' : selectedTimeframe === 'month' ? 'day' : 'week'})` : label;
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
              wrapperStyle={{ paddingBottom: '20px' }} 
              formatter={(value, entry) => (
                <span style={{ 
                  color: value === "forecast" ? "#8884d8" : "#4f46e5", 
                  fontSize: "12px" 
                }}>
                  {value === "forecast" ? "Forecast" : "Revenue"}
                </span>
              )}
            />
            
            {/* Reference line for average */}
            <ReferenceLine 
              y={average} 
              stroke="#82ca9d" 
              strokeDasharray="3 3"
              label={{ 
                value: "Avg", 
                position: "insideTopRight",
                fontSize: 11,
                fill: "#82ca9d" 
              }}
            />
            
            {/* Area for historical data */}
            <Area 
              type="monotone" 
              dataKey="value" 
              name="Revenue"
              stroke="#4f46e5"
              strokeWidth={2}
              fillOpacity={0.2}
              fill="url(#colorValue)"
              activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            
            {/* Area for forecast data */}
            <Area 
              type="monotone" 
              dataKey="forecast" 
              name="forecast" 
              stroke="#8884d8"
              strokeWidth={2}
              fillOpacity={0.1}
              strokeDasharray="5 5" 
              fill="url(#colorForecast)"
              activeDot={{ r: 5, stroke: '#8884d8', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

RevenueTrendChart.displayName = 'RevenueTrendChart';
