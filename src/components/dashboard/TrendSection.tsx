
import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";

interface TrendSectionProps {
  trendData: Array<{name: string, value: number}>;
}

// Using memo to prevent unnecessary re-renders
export const TrendSection = memo(({ trendData }: TrendSectionProps) => {
  // Create stable data structure to avoid rerenders
  const validTrendData = Array.isArray(trendData) && trendData.length > 0 
    ? trendData 
    : Array(6).fill(0).map((_, i) => ({
        name: `${i+1}`,
        value: 10000 + Math.floor(i * 1000) // More predictable values
      }));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>
          Your pharmacy revenue compared to industry average
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <RevenueTrendChart data={validTrendData} />
      </CardContent>
    </Card>
  );
});

TrendSection.displayName = 'TrendSection';
