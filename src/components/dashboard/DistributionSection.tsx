
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueDistribution } from "@/components/insights/RevenueDistribution";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface DistributionSectionProps {
  isLoading: boolean;
  revenueDistribution: Array<{name: string, value: number}>;
}

export function DistributionSection({ 
  isLoading, 
  revenueDistribution 
}: DistributionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <LoadingAnimation text="Loading distribution data" size="sm" />
          </div>
        ) : revenueDistribution.length > 0 ? (
          <RevenueDistribution data={revenueDistribution} />
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Distribution Data</AlertTitle>
            <AlertDescription>
              There is not enough sales data to show revenue distribution.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
