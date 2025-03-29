
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";

interface TrendSectionProps {
  trendData: Array<{name: string, value: number}>;
}

export function TrendSection({ trendData }: TrendSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <RevenueTrendChart data={trendData} />
      </CardContent>
    </Card>
  );
}
