
import { AlertCircle, Package, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface MarketForecastTabProps {
  forecastData: any[];
  regionalDemandData: any[];
  seasonalTrendsData: any[];
  pharmacyLocation: any;
}

export const MarketForecastTab = ({
  forecastData,
  regionalDemandData,
  seasonalTrendsData,
  pharmacyLocation
}: MarketForecastTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sales Forecast for {pharmacyLocation?.state || 'Indian Market'}</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>Projected sales based on historical data and regional market conditions</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {forecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, 'Predicted Revenue']} />
                <Line type="monotone" dataKey="prediction" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                There is not enough historical sales data to generate a forecast.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-500" />
              Inventory Forecast
            </CardTitle>
            <CardDescription>Projected inventory needs based on regional demand</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {regionalDemandData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalDemandData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} units`, 'Projected Need']} />
                  <Bar dataKey="demand" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Data Processing</AlertTitle>
                <AlertDescription>
                  Regional inventory forecast is currently being processed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
              Growth Opportunities
            </CardTitle>
            <CardDescription>Products with highest growth potential in your region</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {seasonalTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalTrendsData.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Growth Potential']} />
                  <Bar dataKey="demand" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Processing Data</AlertTitle>
                <AlertDescription>
                  Growth opportunity analysis is being calculated.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
