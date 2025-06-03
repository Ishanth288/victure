
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Receipt, 
  TrendingUp, 
  Scan,
  Users,
  AlertTriangle,
  Smartphone
} from "lucide-react";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { useMobileScanner } from "@/hooks/useMobileScanner";
import { CameraScanner } from "./CameraScanner";
import { hapticFeedback } from "@/utils/mobileUtils";
import { Capacitor } from "@capacitor/core";

export function MobileDashboard() {
  const dashboardData = useDashboardData();
  const { 
    isScannerOpen, 
    openScanner, 
    closeScanner, 
    processMedicine,
    isMobileApp 
  } = useMobileScanner();

  const isNativeApp = Capacitor.isNativePlatform();

  const formatCurrency = (value: number) => {
    return `₹ ${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const handleQuickAction = async (action: string) => {
    if (isNativeApp) {
      await hapticFeedback('medium');
    }
    
    if (action === 'scan') {
      openScanner();
    } else if (action === 'bill') {
      // Handle quick bill action
      console.log('Quick bill action');
    }
  };

  const quickStats = [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData?.totalRevenue || 0),
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      color: "green"
    },
    {
      title: "Inventory Value",
      value: formatCurrency(dashboardData?.totalInventoryValue || 0),
      icon: <Package className="h-6 w-6 text-blue-600" />,
      color: "blue"
    },
    {
      title: "Total Patients",
      value: (dashboardData?.totalPatients || 0).toString(),
      icon: <Users className="h-6 w-6 text-purple-600" />,
      color: "purple"
    },
    {
      title: "Low Stock Items",
      value: (dashboardData?.lowStockItems || 0).toString(),
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      color: "orange"
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Platform Status Banner */}
        <Card className={`${isNativeApp ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-6 w-6" />
              <div>
                <p className="font-semibold">
                  {isNativeApp ? 'Native Mobile App' : 'Mobile Web Version'}
                </p>
                <p className="text-xs opacity-90">
                  {isNativeApp ? 'Full native features enabled' : 'Limited mobile features'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Enhanced for Mobile */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleQuickAction('scan')}
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-20 flex-col space-y-2 touch-manipulation"
                disabled={!isMobileApp}
                size="lg"
              >
                <Scan className="h-8 w-8" />
                <span className="text-sm font-medium">Scan Medicine</span>
                {isNativeApp && <span className="text-xs opacity-75">Tap to scan</span>}
              </Button>
              <Button 
                onClick={() => handleQuickAction('bill')}
                className="bg-white/20 hover:bg-white/30 text-white border-0 h-20 flex-col space-y-2 touch-manipulation"
                size="lg"
              >
                <Receipt className="h-8 w-8" />
                <span className="text-sm font-medium">Quick Bill</span>
                <span className="text-xs opacity-75">Create bill</span>
              </Button>
            </div>
            {!isMobileApp && (
              <div className="text-center p-2 bg-white/10 rounded">
                <p className="text-xs text-white/75">
                  📱 Install the mobile app for camera scanning
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 gap-4">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow touch-manipulation">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-2 font-medium">{stat.title}</p>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{stat.value}</p>
                  </div>
                  <div className="ml-3 p-2 bg-gray-50 rounded-lg">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Stock Alert - Enhanced for Mobile */}
        {(dashboardData?.lowStockItems || 0) > 0 && (
          <Card className="border-orange-200 bg-orange-50 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-800">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {dashboardData?.lowStockItems} items need immediate restocking
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs px-3 py-1">
                  Urgent
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity - Mobile Native Style */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <span>Recent Activity</span>
              {isNativeApp && <Badge variant="secondary" className="text-xs">Live</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center text-gray-500 py-12">
              <Receipt className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs text-gray-400 mt-1">Your transactions will appear here</p>
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
