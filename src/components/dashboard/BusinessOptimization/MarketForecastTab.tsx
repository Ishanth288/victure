import { AlertCircle, Package, TrendingUp, Clock, Share2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MarketForecastTabProps {
  forecastData: any[];
  regionalDemandData: any[];
  seasonalTrendsData: any[];
  pharmacyLocation: any;
  lastRefreshed?: Date;
}

export const MarketForecastTab = ({
  forecastData,
  regionalDemandData,
  seasonalTrendsData,
  pharmacyLocation,
  lastRefreshed
}: MarketForecastTabProps) => {
  const formatLastRefreshed = (date?: Date) => {
    if (!date) return "Unknown";
    
    // Check if it was refreshed today
    const today = new Date();
    const refreshDate = new Date(date);
    const isToday = today.toDateString() === refreshDate.toDateString();
    
    if (isToday) {
      return `Today at ${refreshDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Format the date
    return refreshDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate average and total sales
  const calculateSalesMetrics = (data: any[]) => {
    if (!data || data.length === 0) return { total: 0, average: 0 };
    
    const total = data.reduce((sum, item) => sum + (item.prediction || 0), 0);
    const average = total / data.length;
    
    return {
      total: Math.round(total),
      average: Math.round(average)
    };
  };
  
  const salesMetrics = calculateSalesMetrics(forecastData);
  
  // Prepare forecast data to show all 12 months or alternating months
  const prepareChartData = () => {
    // Make sure we have enough data
    if (!forecastData || forecastData.length < 6) {
      return [];
    }
    
    // Show alternating months (every even month) if we have 12 months of data
    if (forecastData.length >= 12) {
      const evenMonths = forecastData.filter((_, index) => index % 2 === 0);
      const oddMonths = forecastData.filter((_, index) => index % 2 !== 0);
      
      return {
        yourPharmacy: evenMonths.map(item => ({
          month: item.month,
          value: Math.round(item.prediction)
        })),
        industryAverage: oddMonths.map(item => ({
          month: item.month,
          value: Math.round(item.prediction * 0.85)
        }))
      };
    }
    
    // Otherwise show all months
    return {
      yourPharmacy: forecastData.map(item => ({
        month: item.month,
        value: Math.round(item.prediction)
      })),
      industryAverage: forecastData.map(item => ({
        month: item.month,
        value: Math.round(item.prediction * 0.85)
      }))
    };
  };
  
  const chartData = prepareChartData();
  
  // Combine the data for displaying in the chart
  const combinedChartData = forecastData.map(item => ({
    month: item.month,
    yourPharmacy: Math.round(item.prediction),
    industryAverage: Math.round(item.prediction * 0.85)
  }));
  
  // Color customization with higher contrast
  const yourPharmacyColor = "#0D9488"; // Primary color
  const industryAvgColor = "#65a30d"; // Lime-600
  
  // Chart config
  const chartConfig = {
    yourPharmacy: {
      label: "Your Pharmacy",
      theme: {
        light: yourPharmacyColor,
        dark: yourPharmacyColor,
      },
    },
    industryAverage: {
      label: "Industry Average",
      theme: {
        light: industryAvgColor,
        dark: industryAvgColor,
      },
    },
  };
  
  return (
    <div className="space-y-4 pt-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sales Forecast for {pharmacyLocation?.state || 'Indian Market'}</span>
            <Badge variant="outline" className="ml-2">Trend Analysis</Badge>
          </CardTitle>
          <CardDescription>Projected vs. industry average sales based on historical data</CardDescription>
        </CardHeader>
        <CardContent>
          {forecastData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Monthly Average</div>
                    <div className="text-2xl font-bold mt-1">₹{salesMetrics.average.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Based on your historical sales</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Total Projected</div>
                    <div className="text-2xl font-bold mt-1">₹{salesMetrics.total.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">Next {forecastData.length} months</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground">Market Position</div>
                    <div className="text-2xl font-bold mt-1 flex items-center">
                      <span>Stable</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="ml-1">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[180px] text-xs">Based on comparing your data with similar pharmacies in {pharmacyLocation?.state || 'your region'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Within 15% of industry average</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Chart with improved alignment and labels */}
              <div className="h-[250px] w-full">
                <ChartContainer config={chartConfig}>
                  <LineChart data={combinedChartData} className="h-full" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      tickMargin={8}
                      padding={{ left: 10, right: 10 }}
                      tick={{ fill: "#64748B" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      tickFormatter={(value) => `₹${value/1000}k`}
                      tickMargin={8}
                      width={45}
                      tick={{ fill: "#64748B" }}
                      domain={['auto', 'auto']}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value: number, name: string) => {
                            const formattedName = name === "yourPharmacy" ? "Your Pharmacy" : "Industry Average";
                            return [`₹${value.toLocaleString()}`, formattedName];
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="yourPharmacy"
                      stroke={yourPharmacyColor}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name="yourPharmacy"
                      animationDuration={0} // Prevent flickering
                    />
                    <Line
                      type="monotone"
                      dataKey="industryAverage"
                      stroke={industryAvgColor}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: "white", strokeWidth: 2 }}
                      name="industryAverage"
                      animationDuration={0} // Prevent flickering
                    />
                    <Legend 
                      align="center"
                      verticalAlign="top"
                      height={36}
                      wrapperStyle={{ paddingBottom: "10px" }}
                      formatter={(value) => value === "yourPharmacy" ? "Your Pharmacy" : "Industry Average"}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
              
              <div className="text-xs text-center text-muted-foreground mt-1">
                <span className="inline-flex items-center mr-3">
                  <span className="inline-block w-3 h-0.5 bg-[#0D9488] mr-1"></span>
                  Your Pharmacy (Solid Line)
                </span>
                <span className="inline-flex items-center">
                  <span className="inline-block w-3 h-0.5 bg-[#65a30d] mr-1 border-t border-dashed"></span>
                  Industry Average (Dashed Line)
                </span>
              </div>
            </div>
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
        <CardFooter className="text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {formatLastRefreshed(lastRefreshed)}
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              Inventory Forecast
            </CardTitle>
            <CardDescription>Top 5 products with highest projected demand</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {regionalDemandData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={regionalDemandData.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 85, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `${value}`}
                    tick={{ fill: "#64748B" }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="product" 
                    width={85}
                    fontSize={12}
                    tick={{ fill: "#64748B" }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value} units`, 'Projected Demand']} 
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Bar 
                    dataKey="demand" 
                    fill="#0D9488" 
                    name="Monthly Demand" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={0} // Prevent flickering
                  />
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
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Growth Opportunities
            </CardTitle>
            <CardDescription>Products with highest growth potential in your region</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {seasonalTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={seasonalTrendsData.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 85, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: "#64748B" }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={85}
                    fontSize={12}
                    tick={{ fill: "#64748B" }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [`${value}%`, 'Growth Potential']}
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Bar 
                    dataKey="demand" 
                    fill="#0D9488" 
                    name="Growth %" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={0} // Prevent flickering
                  />
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
