
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface RevenueDistributionProps {
  data: Array<{
    name: string;
    value: number;
  }>;
}

export function RevenueDistribution({ data }: RevenueDistributionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // If no data is provided, use sample data
  if (!data || data.length === 0) {
    data = [
      { name: "Prescription", value: 62000 },
      { name: "OTC", value: 35000 },
      { name: "Supplies", value: 18500 },
      { name: "Other", value: 9800 }
    ];
  }
  
  const chartConfig = {
    prescription: {
      label: "Prescription Sales",
      color: "#0088FE"
    },
    otc: {
      label: "OTC Medicines",
      color: "#00C49F"
    },
    supplies: {
      label: "Medical Supplies",
      color: "#FFBB28"
    },
    other: {
      label: "Other Services",
      color: "#FF8042"
    }
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartContainer config={chartConfig} className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40} // Making it a donut chart
                fill="#8884d8"
                paddingAngle={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={(props) => {
                  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                  return (
                    <g>
                      <Pie
                        data={[props]}
                        dataKey="value"
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 10}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        opacity={0.8}
                      />
                    </g>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value: number) => {
                      return [
                        `₹${value.toLocaleString()}`,
                        `${((value / totalValue) * 100).toFixed(1)}%`
                      ];
                    }} 
                  />
                } 
              />
              <Legend 
                formatter={(value, entry, index) => {
                  if (typeof index === 'number') {
                    return (
                      <span style={{ 
                        color: COLORS[index % COLORS.length], 
                        fontWeight: activeIndex === index ? 'bold' : 'normal' 
                      }}>
                        {value} (₹{data[index]?.value.toLocaleString() || 0})
                      </span>
                    );
                  }
                  return value;
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
