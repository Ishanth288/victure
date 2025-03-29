
import { AlertCircle, MapPin, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#E91E63', '#9C27B0'];

interface RegionalDemandTabProps {
  regionalDemandData: any[];
  pharmacyLocation: any;
  locationData: any;
}

export const RegionalDemandTab = ({
  regionalDemandData,
  pharmacyLocation,
  locationData
}: RegionalDemandTabProps) => {
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Regional Demand Analysis for {pharmacyLocation?.state || 'Your Region'}</span>
            <Badge variant="outline" className="ml-2">Real-time</Badge>
          </CardTitle>
          <CardDescription>Product demand specific to your location</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {regionalDemandData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalDemandData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} units`, 'Regional Demand']} />
                <Bar dataKey="demand" fill="#8884d8">
                  {regionalDemandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Processing Regional Data</AlertTitle>
              <AlertDescription>
                Regional demand analysis is being prepared.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-cyan-500" />
              Regional Health Trends
            </CardTitle>
            <CardDescription>Health conditions prevalent in your region</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {pharmacyLocation ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Common health concerns in {pharmacyLocation.state}:</p>
                
                <div className="space-y-3">
                  {pharmacyLocation.state === 'Maharashtra' && (
                    <>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Hypertension</span>
                        <Badge variant="outline">High prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Diabetes Type 2</span>
                        <Badge variant="outline">High prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Respiratory issues</span>
                        <Badge variant="outline">Medium prevalence</Badge>
                      </div>
                    </>
                  )}
                  
                  {pharmacyLocation.state === 'Tamil Nadu' && (
                    <>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Diabetes</span>
                        <Badge variant="outline">Very high prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Hypertension</span>
                        <Badge variant="outline">Medium prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Joint disorders</span>
                        <Badge variant="outline">Medium prevalence</Badge>
                      </div>
                    </>
                  )}
                  
                  {pharmacyLocation.state === 'Delhi' && (
                    <>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Respiratory disorders</span>
                        <Badge variant="outline">Very high prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Allergies</span>
                        <Badge variant="outline">High prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Stress-related conditions</span>
                        <Badge variant="outline">High prevalence</Badge>
                      </div>
                    </>
                  )}
                  
                  {!['Maharashtra', 'Tamil Nadu', 'Delhi'].includes(pharmacyLocation.state) && (
                    <>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Hypertension</span>
                        <Badge variant="outline">Medium prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Diabetes</span>
                        <Badge variant="outline">Medium prevalence</Badge>
                      </div>
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="font-medium">Seasonal flu</span>
                        <Badge variant="outline">Varies by season</Badge>
                      </div>
                    </>
                  )}
                </div>
                
                <p className="text-sm mt-2">Recommendation: Stock medications and supplements targeting these conditions.</p>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Location Required</AlertTitle>
                <AlertDescription>
                  Update your pharmacy profile with location information.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-violet-500" />
              Regional Inventory Optimization
            </CardTitle>
            <CardDescription>Location-specific inventory recommendations</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {(pharmacyLocation && regionalDemandData.length > 0) ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Based on the specific needs of {pharmacyLocation.state}, consider these inventory adjustments:</p>
                
                <ul className="space-y-1 text-sm">
                  <li className="flex items-start">
                    <Badge className="mt-0.5 mr-2 bg-green-100 text-green-800">➕</Badge>
                    <span>Increase stock levels for <strong>{regionalDemandData[0]?.product}</strong> and <strong>{regionalDemandData[1]?.product}</strong> by 20%</span>
                  </li>
                  <li className="flex items-start">
                    <Badge className="mt-0.5 mr-2 bg-amber-100 text-amber-800">⚠️</Badge>
                    <span>Maintain current levels for <strong>{regionalDemandData[2]?.product}</strong> and <strong>{regionalDemandData[3]?.product}</strong></span>
                  </li>
                  <li className="flex items-start">
                    <Badge className="mt-0.5 mr-2 bg-blue-100 text-blue-800">ℹ️</Badge>
                    <span>Consider adding regional specialties like <strong>{pharmacyLocation.state === 'Maharashtra' ? 'Ayurvedic supplements' : (pharmacyLocation.state === 'Tamil Nadu' ? 'Siddha medicines' : 'Local herbal remedies')}</strong></span>
                  </li>
                  <li className="flex items-start">
                    <Badge className="mt-0.5 mr-2 bg-purple-100 text-purple-800">💡</Badge>
                    <span>Partner with local {pharmacyLocation.state === 'Maharashtra' ? 'Ayurveda' : (pharmacyLocation.state === 'Tamil Nadu' ? 'Siddha' : 'traditional medicine')} practitioners to enhance offerings</span>
                  </li>
                </ul>
                
                <div className="mt-4 p-2 bg-blue-50 rounded-md text-sm">
                  <p className="font-medium text-blue-700">Regional Insight:</p>
                  <p className="text-blue-600">
                    {pharmacyLocation.state === 'Maharashtra' ? 
                      'Urban areas show higher demand for stress and lifestyle medications.' : 
                      (pharmacyLocation.state === 'Tamil Nadu' ? 
                        'Traditional medicine supplements have growing demand alongside allopathic medication.' : 
                        'Local health trends suggest increasing demand for preventive healthcare products.')}
                  </p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Building Recommendations</AlertTitle>
                <AlertDescription>
                  Regional optimization suggestions are being prepared.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
