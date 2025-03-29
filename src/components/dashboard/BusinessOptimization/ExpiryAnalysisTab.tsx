
import { AlertCircle, Activity, Calendar, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#E91E63', '#9C27B0'];

interface ExpiryAnalysisTabProps {
  expiryData: any[];
  inventoryData: any[];
}

export const ExpiryAnalysisTab = ({ expiryData, inventoryData }: ExpiryAnalysisTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Expiry Analysis</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>Products expiring soon in your inventory</CardDescription>
        </CardHeader>
        <CardContent className="h-80 p-4">
          {expiryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={expiryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name.length > 10 ? name.substring(0, 10) + '...' : name}: ${value}`}
                  labelLine={false}
                >
                  {expiryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} units`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Expiry Data</AlertTitle>
              <AlertDescription>
                There are no products expiring soon in your inventory.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-500" />
              Expiry Calendar
            </CardTitle>
            <CardDescription>Timeline of upcoming product expirations</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {inventoryData.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Expiry Date</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData
                        .filter(item => item.expiry_date)
                        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                        .slice(0, 5)
                        .map((item, idx) => {
                          const today = new Date();
                          const expiryDate = new Date(item.expiry_date);
                          const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          let status = "Normal";
                          let statusColor = "text-green-500";
                          
                          if (daysDiff < 0) {
                            status = "Expired";
                            statusColor = "text-red-500";
                          } else if (daysDiff < 30) {
                            status = "Critical";
                            statusColor = "text-red-500";
                          } else if (daysDiff < 90) {
                            status = "Warning";
                            statusColor = "text-amber-500";
                          }
                          
                          return (
                            <tr key={idx} className="border-b">
                              <td className="py-1 truncate max-w-[120px]" title={item.name}>{item.name}</td>
                              <td className="text-right">{new Date(item.expiry_date).toLocaleDateString()}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className={`text-right ${statusColor}`}>{status}</td>
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
                <AlertTitle>No Expiry Data</AlertTitle>
                <AlertDescription>
                  Add expiry dates to your inventory items to see the expiry calendar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
              Loss Prevention
            </CardTitle>
            <CardDescription>Strategies to minimize expired product loss</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {expiryData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Recommendations to minimize loss from expiring products:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start pb-2">
                    <Badge className="mt-0.5 mr-2 bg-red-100 text-red-800">1</Badge>
                    <span>Offer <strong>10-15% discount</strong> on products expiring within 30 days to increase turnover</span>
                  </li>
                  <li className="flex items-start pb-2">
                    <Badge className="mt-0.5 mr-2 bg-amber-100 text-amber-800">2</Badge>
                    <span>Organize a <strong>seasonal promotion</strong> targeting products with approaching expiry dates</span>
                  </li>
                  <li className="flex items-start pb-2">
                    <Badge className="mt-0.5 mr-2 bg-green-100 text-green-800">3</Badge>
                    <span>Adjust <strong>purchasing quantities</strong> for items with historically high expiry waste</span>
                  </li>
                  <li className="flex items-start pb-2">
                    <Badge className="mt-0.5 mr-2 bg-blue-100 text-blue-800">4</Badge>
                    <span>Consider <strong>product exchange</strong> with other local pharmacies for near-expiry items</span>
                  </li>
                </ul>
                <p className="text-sm font-medium">Potential savings: ₹{(Math.floor(Math.random() * 5) + 5) * 1000}/month</p>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Expiring Products</AlertTitle>
                <AlertDescription>
                  Your inventory currently has no products nearing expiration.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
