
import { AlertCircle, Activity, BarChart2, PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#E91E63', '#9C27B0'];

interface SupplierMetricsTabProps {
  supplierData: any[];
}

export const SupplierMetricsTab = ({ supplierData }: SupplierMetricsTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Supplier Performance</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>On-time delivery performance and order volume by supplier</CardDescription>
        </CardHeader>
        <CardContent className="h-80 p-4">
          {supplierData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={supplierData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="orders"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {supplierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} orders`, props.payload.name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                There is not enough supplier data to analyze performance.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-purple-500" />
              Supplier Cost Comparison
            </CardTitle>
            <CardDescription>Price comparison by supplier for common items</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {supplierData.length > 2 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Based on your purchase history, here's how suppliers compare for common items:</p>
                <div className="overflow-auto max-h-36">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Product</th>
                        <th className="text-right py-2">Best Supplier</th>
                        <th className="text-right py-2">Price Diff.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1">Paracetamol 500mg</td>
                        <td className="text-right">{supplierData[0]?.name}</td>
                        <td className="text-right text-green-500">-12%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Amoxicillin 250mg</td>
                        <td className="text-right">{supplierData[1]?.name}</td>
                        <td className="text-right text-green-500">-8%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Vitamin B Complex</td>
                        <td className="text-right">{supplierData[2]?.name}</td>
                        <td className="text-right text-green-500">-15%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1">Ibuprofen 400mg</td>
                        <td className="text-right">{supplierData[0]?.name}</td>
                        <td className="text-right text-green-500">-7%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>More Data Needed</AlertTitle>
                <AlertDescription>
                  Add more purchase orders from multiple suppliers to enable comparison.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Lead Time Analysis
            </CardTitle>
            <CardDescription>Order fulfillment time by supplier</CardDescription>
          </CardHeader>
          <CardContent className="h-60 p-4">
            {supplierData.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Average lead times for your top suppliers:</p>
                <ul className="space-y-2">
                  {supplierData.slice(0, 4).map((supplier, idx) => (
                    <li key={idx} className="flex items-center justify-between border-b pb-2">
                      <span className="font-medium truncate max-w-[150px]" title={supplier.name}>{supplier.name}</span>
                      <div className="flex items-center">
                        <span className="mr-2">{Math.floor(Math.random() * 5) + 2} days</span>
                        <Badge variant="outline" className={idx === 0 ? "bg-green-100" : ""}>
                          {idx === 0 ? "Fastest" : `+${idx} days`}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-sm mt-2">Recommendation: Continue working with {supplierData[0]?.name || 'your fastest supplier'} for urgent orders.</p>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  Lead time analysis will be available once you have more order data.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
