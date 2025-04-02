
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TabContent } from "./components/TabContent";
import { 
  EnhancedRevenueSection, 
  EnhancedDistributionSection,
  EnhancedInventoryForecastSection
} from "./components/VisualizationComponents";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define props interface for the component
export interface MarketForecastTabProps {
  forecastData: any[];
  regionalDemandData: any[];
  seasonalTrendsData: any[];
  pharmacyLocation: any;
  isLoading?: boolean;
}

export const MarketForecastTab: React.FC<MarketForecastTabProps> = ({
  forecastData,
  regionalDemandData,
  seasonalTrendsData,
  pharmacyLocation,
  isLoading = false
}) => {
  // If no data is provided, create sample data for demonstration
  const sampleRevenueData = forecastData?.length > 0 ? forecastData : [
    { date: "2023-01", value: 10500 },
    { date: "2023-02", value: 12300 },
    { date: "2023-03", value: 11800 },
    { date: "2023-04", value: 14200 },
    { date: "2023-05", value: 15800 },
    { date: "2023-06", value: 16500 },
    { date: "2023-07", value: 18200 },
    { date: "2023-08", value: 17500 }
  ];
  
  const sampleDistributionData = regionalDemandData?.length > 0 ? regionalDemandData : [
    { name: "Prescription", value: 45000 },
    { name: "OTC", value: 32000 },
    { name: "Medical Supplies", value: 18000 },
    { name: "Supplements", value: 15000 }
  ];
  
  const sampleInventoryData = seasonalTrendsData?.length > 0 ? seasonalTrendsData : [
    { id: 1, name: "Paracetamol", quantity: 150, reorder_point: 50, unit_cost: 5, selling_price: 10, projected_demand: 30 },
    { id: 2, name: "Amoxicillin", quantity: 80, reorder_point: 40, unit_cost: 15, selling_price: 25, projected_demand: 25 },
    { id: 3, name: "Ibuprofen", quantity: 200, reorder_point: 60, unit_cost: 8, selling_price: 15, projected_demand: 40 },
    { id: 4, name: "Metformin", quantity: 120, reorder_point: 50, unit_cost: 12, selling_price: 20, projected_demand: 35 },
    { id: 5, name: "Vitamin D", quantity: 300, reorder_point: 100, unit_cost: 6, selling_price: 18, projected_demand: 80 }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Market Forecast</h2>
          <p className="text-muted-foreground">
            Analyze market trends and optimize your inventory and pricing strategies
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="distribution">Revenue Distribution</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-6">
          <TabContent>
            <EnhancedRevenueSection isLoading={isLoading} revenueData={sampleRevenueData} />
          </TabContent>
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-6">
          <TabContent>
            <EnhancedDistributionSection isLoading={isLoading} revenueDistribution={sampleDistributionData} />
          </TabContent>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-6">
          <TabContent>
            <EnhancedInventoryForecastSection isLoading={isLoading} inventoryData={sampleInventoryData} />
          </TabContent>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
          <CardDescription>
            Strategic recommendations based on your market data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pricing Optimization</AlertTitle>
              <AlertDescription>
                Based on market trends, consider adjusting prices for seasonal medications to optimize revenue during high demand periods.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Inventory Management</AlertTitle>
              <AlertDescription>
                Seasonal trends indicate you should increase stock of cold & flu medications by 20% for the upcoming season.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
