
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RevenueTrendChart } from "@/components/insights/RevenueTrendChart";
import { RevenueDistribution } from "@/components/insights/RevenueDistribution";
import { InventoryForecastChart } from "@/components/insights/InventoryForecastChart";
import { GrowthOpportunitiesChart } from "@/components/insights/GrowthOpportunitiesChart";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface VisualizationProps {
  isLoading: boolean;
  data: any[];
  type: 'revenueTrend' | 'revenueDistribution' | 'inventoryForecast' | 'growthOpportunities';
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function VisualizationContainer({ 
  isLoading, 
  data = [], 
  type,
  title,
  emptyTitle = "No Data Available",
  emptyDescription = "There is not enough data available to show this visualization."
}: VisualizationProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <LoadingAnimation text={`Loading ${title || type} data`} size="sm" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{emptyTitle}</AlertTitle>
        <AlertDescription>
          {emptyDescription}
        </AlertDescription>
      </Alert>
    );
  }

  switch (type) {
    case 'revenueTrend':
      return <RevenueTrendChart data={data} />;
    case 'revenueDistribution':
      return <RevenueDistribution data={data} />;
    case 'inventoryForecast':
      return <InventoryForecastChart inventoryData={data} />;
    case 'growthOpportunities':
      return <GrowthOpportunitiesChart opportunities={data} />;
    default:
      return null;
  }
}

export function EnhancedRevenueSection({ isLoading, revenueData }: { isLoading: boolean, revenueData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <VisualizationContainer 
          isLoading={isLoading}
          data={revenueData}
          type="revenueTrend"
          title="revenue forecast"
          emptyDescription="There is no revenue data available for forecasting."
        />
      </CardContent>
    </Card>
  );
}

export function EnhancedDistributionSection({ 
  isLoading, 
  revenueDistribution 
}: { isLoading: boolean, revenueDistribution: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <VisualizationContainer 
          isLoading={isLoading}
          data={revenueDistribution}
          type="revenueDistribution"
          title="distribution data"
          emptyDescription="There is not enough sales data to show revenue distribution."
        />
      </CardContent>
    </Card>
  );
}

export function EnhancedInventoryForecastSection({ 
  isLoading, 
  inventoryData 
}: { isLoading: boolean, inventoryData: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <VisualizationContainer 
          isLoading={isLoading}
          data={inventoryData}
          type="inventoryForecast"
          title="inventory forecast"
          emptyDescription="There is not enough inventory data to display forecasts."
        />
      </CardContent>
    </Card>
  );
}

export function EnhancedGrowthSection({ 
  isLoading, 
  data = []
}: { isLoading: boolean, data?: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Growth Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <VisualizationContainer 
          isLoading={isLoading}
          data={data.length > 0 ? data : [
            // Sample data if no real data provided
            { name: "Paracetamol 500mg", potentialRevenue: 45000, confidence: 0.85, category: "OTC", action: "Stock up for flu season" },
            { name: "Diabetic Supplies", potentialRevenue: 38000, confidence: 0.92, category: "Medical Supplies", action: "Increase variety" },
            { name: "Multivitamins", potentialRevenue: 32000, confidence: 0.78, category: "Supplements", action: "Run promotions" }
          ]}
          type="growthOpportunities"
          title="growth opportunities"
          emptyDescription="There is not enough data to identify growth opportunities."
        />
      </CardContent>
    </Card>
  );
}
