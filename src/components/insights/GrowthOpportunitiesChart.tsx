
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GrowthOpportunity {
  name: string;
  potentialRevenue: number;
  confidence: number;
  category: string;
  action: string;
}

interface GrowthOpportunitiesChartProps {
  opportunities: GrowthOpportunity[];
}

export function GrowthOpportunitiesChart({ opportunities = [] }: GrowthOpportunitiesChartProps) {
  // If no opportunities data is provided, use sample data
  const data = opportunities.length > 0 ? opportunities : [
    { 
      name: "Paracetamol 500mg", 
      potentialRevenue: 45000, 
      confidence: 0.85,
      category: "OTC",
      action: "Stock up for flu season"
    },
    { 
      name: "Diabetic Supplies", 
      potentialRevenue: 38000, 
      confidence: 0.92,
      category: "Medical Supplies",
      action: "Increase variety"
    },
    { 
      name: "Multivitamins", 
      potentialRevenue: 32000, 
      confidence: 0.78,
      category: "Supplements",
      action: "Run promotions"
    },
    { 
      name: "Antibacterial Soaps", 
      potentialRevenue: 28000, 
      confidence: 0.72,
      category: "Personal Care",
      action: "Add premium options"
    },
    { 
      name: "Blood Pressure Monitors", 
      potentialRevenue: 25000, 
      confidence: 0.88,
      category: "Equipment",
      action: "Showcase prominently"
    }
  ];

  // Sort data by potential revenue
  const sortedData = [...data].sort((a, b) => b.potentialRevenue - a.potentialRevenue);
  const topOpportunities = sortedData.slice(0, 5);

  // Color scale based on confidence
  const getBarColor = (confidence: number) => {
    if (confidence >= 0.9) return "#10b981"; // High confidence - green
    if (confidence >= 0.7) return "#3b82f6"; // Medium confidence - blue
    return "#f59e0b"; // Lower confidence - amber
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    return `₹${value}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center">
              Growth Opportunities <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Products with high growth potential in your region</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topOpportunities}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                domain={[0, 'dataMax + 5000']}
                tickFormatter={formatCurrency}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <Tooltip
                formatter={(value: number) => [`${formatCurrency(value)}`, 'Potential Revenue']}
                labelFormatter={(label) => label}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="potentialRevenue" name="Potential Revenue" radius={[0, 6, 6, 0]}>
                {topOpportunities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.confidence)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Actionable insights */}
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium">Actionable Insights:</h4>
          <ul className="space-y-2">
            {topOpportunities.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5 min-w-[80px]">
                  {item.category}
                </Badge>
                <div>
                  <span className="font-medium">{item.name}:</span> {item.action}
                </div>
              </li>
            ))}
          </ul>
          {topOpportunities.length > 3 && (
            <Button variant="link" size="sm" className="p-0 h-auto text-sm">
              View all insights <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
