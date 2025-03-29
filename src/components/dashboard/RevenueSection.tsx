
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueChart } from "@/components/insights/RevenueChart";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RevenueSectionProps {
  isLoading: boolean;
  revenueData: Array<{date: string, value: number}>;
}

export function RevenueSection({ isLoading, revenueData }: RevenueSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>Loading revenue data...</p>
          </div>
        ) : revenueData.length > 0 ? (
          <RevenueChart data={revenueData} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Revenue Data</AlertTitle>
            <AlertDescription>
              There is no revenue data available for the last 30 days.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
