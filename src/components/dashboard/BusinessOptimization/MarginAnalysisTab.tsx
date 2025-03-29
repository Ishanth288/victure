
import { AlertCircle, TrendingDown, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface MarginAnalysisTabProps {
  marginData: any[];
  locationData: any;
  pharmacyLocation: any;
}

export const MarginAnalysisTab = ({
  marginData,
  locationData,
  pharmacyLocation
}: MarginAnalysisTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profit Margin by Product</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>Highest margin products in your inventory</CardDescription>
        </CardHeader>
        <CardContent className="h-80 p-4">
          {marginData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={marginData}
                margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  height={40}
                  tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value} 
                />
                <YAxis 
                  width={50}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Margin']} />
                <Bar dataKey="margin" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                There is not enough product data to analyze margins.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Pricing Optimization
            </CardTitle>
            <CardDescription>Recommended price adjustments based on regional market</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {locationData ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Based on market analysis for {pharmacyLocation?.state || 'your region'}, the following price optimizations are recommended:</p>
                <ul className="space-y-2">
                  <li className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Pain relievers</span>
                    <Badge className="bg-green-500">+5% ↑</Badge>
                  </li>
                  <li className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Antibiotics</span>
                    <Badge className="bg-green-500">+3% ↑</Badge>
                  </li>
                  <li className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Vitamins & Supplements</span>
                    <Badge className="bg-green-500">+7% ↑</Badge>
                  </li>
                  <li className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Cough & Cold medicines</span>
                    <Badge className="bg-red-500">-2% ↓</Badge>
                  </li>
                </ul>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Location Data Required</AlertTitle>
                <AlertDescription>
                  Price optimization requires your pharmacy location to be set.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
              Low Margin Alert
            </CardTitle>
            <CardDescription>Products with margins below regional average</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {marginData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">These products have margins significantly below the average for {pharmacyLocation?.state || 'your region'}:</p>
                <ul className="space-y-2">
                  {marginData
                    .filter(item => item.margin < 25)
                    .slice(0, 4)
                    .map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b pb-2">
                        <span className="font-medium truncate max-w-[150px]" title={item.name}>{item.name}</span>
                        <div className="flex items-center">
                          <span className="text-red-500 mr-2">{item.margin}%</span>
                          <Badge variant="outline">Consider raising price</Badge>
                        </div>
                      </li>
                    ))}
                </ul>
                
                {marginData.filter(item => item.margin < 25).length === 0 && (
                  <p className="text-center text-green-500 font-medium pt-6">
                    All products have healthy margins. Great job!
                  </p>
                )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Insufficient Data</AlertTitle>
                <AlertDescription>
                  Add more products with proper cost information to receive margin alerts.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
