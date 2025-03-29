
import { AlertCircle, Calendar, TrendingUp, Clock, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface SeasonalTrendsTabProps {
  locationData: any;
  pharmacyLocation: any;
  seasonalTrendsData: any[];
  inventoryData: any[];
  lastRefreshed?: Date;
}

export const SeasonalTrendsTab = ({
  locationData,
  pharmacyLocation,
  seasonalTrendsData,
  inventoryData,
  lastRefreshed
}: SeasonalTrendsTabProps) => {
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    
    if (month >= 2 && month <= 4) return "Spring"; // March-May
    if (month >= 5 && month <= 7) return "Summer"; // June-August
    if (month >= 8 && month <= 10) return "Fall"; // September-November
    return "Winter"; // December-February
  };
  
  const currentSeason = getCurrentSeason();
  
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
  
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Seasonal Health Trends: {currentSeason} {new Date().getFullYear()}</span>
            <Badge variant="outline" className="ml-2">Google Trends Data</Badge>
          </CardTitle>
          <CardDescription>Popular health products during {currentSeason} for {pharmacyLocation?.state || 'your region'}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {locationData?.seasonalTrends && locationData.seasonalTrends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full overflow-auto">
              {locationData.seasonalTrends.map((season, idx) => (
                <Card key={idx} className={`border shadow-sm ${season.season.includes(currentSeason) ? 'border-primary bg-primary/5' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      {season.season}
                      {season.season.includes(currentSeason) && (
                        <Badge variant="default" className="ml-2 text-xs">Current</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {season.topProducts.map((product, pidx) => (
                        <li key={pidx} className="flex justify-between items-center text-sm border-b pb-1">
                          <div>
                            <span>{product.name}</span>
                            {product.trend && (
                              <Badge variant={
                                product.trend === 'rising' ? 'success' : 
                                product.trend === 'falling' ? 'destructive' : 
                                'outline'
                              } className="ml-2 text-xs">
                                {product.trend}
                              </Badge>
                            )}
                          </div>
                          <Badge variant={season.season.includes(currentSeason) ? "secondary" : "outline"} className="ml-2">
                            {product.demand} {product.unit || 'packs/week'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    {season.topProducts[0]?.source && (
                      <div className="text-xs text-muted-foreground mt-2 flex items-center">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Source: {season.topProducts[0]?.source}
                      </div>
                    )}
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
        <CardFooter className="text-xs text-muted-foreground pt-2 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Last updated: {formatLastRefreshed(lastRefreshed)}
          <span className="ml-2">(Updates weekly)</span>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              {currentSeason} Inventory Recommendations
            </CardTitle>
            <CardDescription>Suggested inventory levels based on Google Trends data</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {seasonalTrendsData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2">Based on current trends for {pharmacyLocation?.state || 'your region'} during {currentSeason}:</p>
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
                          item.name?.toLowerCase().includes(product.name?.toLowerCase())
                        );
                        const currentStock = matchingInventory?.quantity || 0;
                        const recommended = Math.ceil(product.demand / 10);
                        let action = "No Change";
                        let actionColor = "text-gray-500";
                        
                        if (currentStock < recommended * 0.7) {
                          action = "Increase";
                          actionColor = "text-green-500 font-medium";
                        } else if (currentStock > recommended * 1.3) {
                          action = "Decrease";
                          actionColor = "text-amber-500 font-medium";
                        }
                        
                        return (
                          <tr key={idx} className="border-b">
                            <td className="py-1">{product.name}</td>
                            <td className="text-right">{currentStock} packs</td>
                            <td className="text-right">{recommended} packs</td>
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
              {currentSeason} Promotion Ideas
            </CardTitle>
            <CardDescription>Marketing strategies based on current trends</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {locationData?.seasonalTrends ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Google Trends-based promotion strategies for {currentSeason} in {pharmacyLocation?.state || 'your region'}:</p>
                
                <div className="space-y-3 text-sm">
                  {currentSeason === "Winter" && (
                    <>
                      <div className="p-2 border rounded-md bg-blue-50">
                        <h4 className="font-medium text-blue-700">Winter Wellness Package</h4>
                        <p className="text-muted-foreground">Combine cold remedies, vitamins, and immunity boosters with a 10% discount to increase basket size.</p>
                      </div>
                      
                      <div className="p-2 border rounded-md bg-green-50">
                        <h4 className="font-medium text-green-700">Flu Season Campaign</h4>
                        <p className="text-muted-foreground">Free basic health check with purchase of flu medication. Estimated conversion: 25%</p>
                      </div>
                    </>
                  )}
                  
                  {currentSeason === "Spring" && (
                    <>
                      <div className="p-2 border rounded-md bg-indigo-50">
                        <h4 className="font-medium text-indigo-700">Allergy Relief Bundle</h4>
                        <p className="text-muted-foreground">Package antihistamines with allergy-related products at a 15% bundle discount.</p>
                      </div>
                      
                      <div className="p-2 border rounded-md bg-emerald-50">
                        <h4 className="font-medium text-emerald-700">Spring Cleaning Promotion</h4>
                        <p className="text-muted-foreground">Display household sanitizers, first aid kits, and anti-bacterial products together.</p>
                      </div>
                    </>
                  )}
                  
                  {currentSeason === "Summer" && (
                    <>
                      <div className="p-2 border rounded-md bg-amber-50">
                        <h4 className="font-medium text-amber-700">Summer Protection Kit</h4>
                        <p className="text-muted-foreground">Bundle sunscreen, after-sun care, and hydration supplements with a 12% discount.</p>
                      </div>
                      
                      <div className="p-2 border rounded-md bg-teal-50">
                        <h4 className="font-medium text-teal-700">Travel Medicine Packages</h4>
                        <p className="text-muted-foreground">Curate travel-sized essentials for summer vacations. Expected increase in margin: 14%</p>
                      </div>
                    </>
                  )}
                  
                  {currentSeason === "Fall" && (
                    <>
                      <div className="p-2 border rounded-md bg-orange-50">
                        <h4 className="font-medium text-orange-700">Back-to-School Health Kit</h4>
                        <p className="text-muted-foreground">Package common school health needs with hand sanitizers and vitamin C for children.</p>
                      </div>
                      
                      <div className="p-2 border rounded-md bg-purple-50">
                        <h4 className="font-medium text-purple-700">Seasonal Transition Support</h4>
                        <p className="text-muted-foreground">Promote immune boosters, vitamins, and preventative products. Suggested discount: 8%</p>
                      </div>
                    </>
                  )}
                  
                  <div className="p-2 border rounded-md bg-sky-50">
                    <h4 className="font-medium text-sky-700">Trend-Based Marketing Strategy</h4>
                    <p className="text-muted-foreground">Send SMS alerts about {currentSeason} health tips featuring trending products from Google Trends data.</p>
                  </div>
                </div>
                
                <p className="text-sm font-medium mt-2">Estimated revenue increase: 8-15% during {currentSeason}</p>
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
          <CardFooter className="text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            Updates weekly with new Google Trends and news insights
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
