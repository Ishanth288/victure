
import { AlertCircle, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface SeasonalTrendsTabProps {
  locationData: any;
  pharmacyLocation: any;
  seasonalTrendsData: any[];
  inventoryData: any[];
}

export const SeasonalTrendsTab = ({
  locationData,
  pharmacyLocation,
  seasonalTrendsData,
  inventoryData
}: SeasonalTrendsTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Seasonal Trends for {pharmacyLocation?.state || 'Your Region'}</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>Product demand by season based on your location</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {locationData?.seasonalTrends && locationData.seasonalTrends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-auto">
              {locationData.seasonalTrends.map((season, idx) => (
                <Card key={idx} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{season.season}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {season.topProducts.map((product, pidx) => (
                        <li key={pidx} className="flex justify-between items-center text-sm border-b pb-1">
                          <span>{product.name}</span>
                          <Badge variant="outline" className="ml-2">{product.demand}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Loading Seasonal Data</AlertTitle>
              <AlertDescription>
                Seasonal trends for your region are being processed.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              Current Season Recommendations
            </CardTitle>
            <CardDescription>Inventory adjustments for the current season</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {seasonalTrendsData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Based on historical data for {pharmacyLocation?.state || 'your region'} in this season:</p>
                <div className="overflow-auto max-h-36">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Current Stock</th>
                        <th className="text-right py-2">Recommended</th>
                        <th className="text-right py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonalTrendsData.map((product, idx) => {
                        const matchingInventory = inventoryData.find(item => 
                          item.name.toLowerCase().includes(product.name.toLowerCase())
                        );
                        const currentStock = matchingInventory?.quantity || 0;
                        const recommended = Math.ceil(product.demand / 10);
                        let action = "No Change";
                        let actionColor = "text-gray-500";
                        
                        if (currentStock < recommended * 0.7) {
                          action = "Increase";
                          actionColor = "text-green-500";
                        } else if (currentStock > recommended * 1.3) {
                          action = "Decrease";
                          actionColor = "text-red-500";
                        }
                        
                        return (
                          <tr key={idx} className="border-b">
                            <td className="py-1">{product.name}</td>
                            <td className="text-right">{currentStock}</td>
                            <td className="text-right">{recommended}</td>
                            <td className={`text-right ${actionColor}`}>{action}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Processing Data</AlertTitle>
                <AlertDescription>
                  Seasonal recommendations are being calculated.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
              Seasonal Promotion Ideas
            </CardTitle>
            <CardDescription>Marketing strategies based on seasonal trends</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {locationData?.seasonalTrends ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Consider these promotion strategies for the current season in {pharmacyLocation?.state || 'your region'}:</p>
                
                <div className="space-y-3 text-sm">
                  <div className="p-2 border rounded-md bg-blue-50">
                    <h4 className="font-medium text-blue-700">Seasonal Health Package</h4>
                    <p className="text-muted-foreground">Bundle top 3 seasonal products with a 10% discount to increase basket size.</p>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-green-50">
                    <h4 className="font-medium text-green-700">Preventive Health Campaign</h4>
                    <p className="text-muted-foreground">Offer free health checks alongside seasonal medications to boost store visits.</p>
                  </div>
                  
                  <div className="p-2 border rounded-md bg-amber-50">
                    <h4 className="font-medium text-amber-700">Early Bird Discount</h4>
                    <p className="text-muted-foreground">5% off on seasonal items when purchased before the peak season starts.</p>
                  </div>
                </div>
                
                <p className="text-sm font-medium mt-2">Estimated revenue increase: 8-12%</p>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Location Required</AlertTitle>
                <AlertDescription>
                  Set your pharmacy location to get seasonal promotion ideas.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
