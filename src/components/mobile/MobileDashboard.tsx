
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Receipt, 
  TrendingUp, 
  Scan,
  Users,
  AlertTriangle
} from "lucide-react";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { useMobileScanner } from "@/hooks/useMobileScanner";
import { CameraScanner } from "./CameraScanner";

export function MobileDashboard() {
  const dashboardData = useDashboardData();
  const { 
    isScannerOpen, 
    openScanner, 
    closeScanner, 
    processMedicine,
    isMobileApp 
  } = useMobileScanner();

  const formatCurrency = (value: number) => {
    return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const quickStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData?.totalRevenue || 0),
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      color: "green"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(dashboardData?.totalInventoryValue || 0),
      icon: <Package className="h-5 w-5 text-blue-600" />,
      color: "blue"
    },
    {
      title: "Total Patients",
      value: (dashboardData?.totalPatients || 0).toString(),
      icon: <Users className="h-5 w-5 text-purple-600" />,
      color: "purple"
    },
    {
      title: "Low Stock Items",
      value: (dashboardData?.lowStockItems || 0).toString(),
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      color: "orange"
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={openScanner}
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-16 flex-col"
                disabled={!isMobileApp}
              >
                <Scan className="h-6 w-6 mb-1" />
                <span className="text-xs">Scan Medicine</span>
              </Button>
              <Button 
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-16 flex-col"
              >
                <Receipt className="h-6 w-6 mb-1" />
                <span className="text-xs">Quick Bill</span>
              </Button>
            </div>
            {!isMobileApp && (
              <p className="text-xs text-white/75 text-center">
                Install the mobile app to access camera features
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="ml-2">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Stock Alert */}
        {(dashboardData?.lowStockItems || 0) > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-orange-600">
                    {dashboardData?.lowStockItems} items need restocking
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center text-gray-500 py-8">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <CameraScanner
          onMedicineDetected={processMedicine}
          onClose={closeScanner}
        />
      )}
    </>
  );
}
