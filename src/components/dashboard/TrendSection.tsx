
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";

interface TrendSectionProps {
  trendData: Array<{name: string, value: number}>;
}

export function TrendSection({ trendData }: TrendSectionProps) {
  // Ensure we have valid trend data
  const validTrendData = Array.isArray(trendData) && trendData.length > 0 
    ? trendData 
    : Array(6).fill(0).map((_, i) => ({
        name: `${i+1}`,
        value: Math.floor(10000 + Math.random() * 5000)
      }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <RevenueTrendChart data={validTrendData} />
      </CardContent>
    </Card>
  );
}
