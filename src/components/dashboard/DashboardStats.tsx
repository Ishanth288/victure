import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "react-animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from './hooks/useDashboardData';
import { useState, useEffect } from "react";

export function DashboardStats() {
  const {
    totalRevenue,
    totalInventoryValue,
    totalPrescriptionsToday,
    lowStockItems,
    isLoading,
    lastUpdated,
    connectionStatus,
    loadingProgress
  } = useDashboardData();

  const [showProgressBar, setShowProgressBar] = useState(false);

  // Show progress bar only during initial load or when loading takes time
  useEffect(() => {
    if (isLoading && loadingProgress < 100) {
      setShowProgressBar(true);
    } else {
      // Hide progress bar after a small delay when loading completes
      const timeout = setTimeout(() => setShowProgressBar(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, loadingProgress]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: '🟢', text: 'Fast Connection', color: 'text-green-600' };
      case 'slow':
        return { icon: '🟡', text: 'Slow Connection', color: 'text-yellow-600' };
      case 'disconnected':
        return { icon: '🔴', text: 'Connection Issues', color: 'text-red-600' };
      default:
        return { icon: '⚪', text: 'Unknown', color: 'text-gray-600' };
    }
  };

  const statusInfo = getConnectionStatusIcon();

  const statCards = [
    {
      title: "Total Revenue",
      value: totalRevenue || 0,
      formattedValue: formatCurrency(totalRevenue || 0),
      icon: "₹",
      className: "",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Inventory Value",
      value: totalInventoryValue || 0,
      formattedValue: formatCurrency(totalInventoryValue || 0),
      icon: "📦",
      className: "",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Prescriptions Today",
      value: Math.floor(totalPrescriptionsToday || 0),
      // formattedValue is not directly used for display with AnimatedCounter, value is used.
      // We will handle the unit display in the CardContent.
      icon: "📋",
      className: "",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Low Stock Items",
      value: Math.floor(lowStockItems || 0),
      // formattedValue is not directly used for display with AnimatedCounter, value is used.
      // We will handle the unit display in the CardContent.
      icon: "⚠️",
      className: "cursor-pointer hover:scale-105 transition-transform duration-200",
      link: "/inventory?filter=low-stock",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconColor: "text-orange-600"
    },
  ];

  // Check if all values are zero
  const allZero = totalRevenue === 0 && totalInventoryValue === 0 && totalPrescriptionsToday === 0 && lowStockItems === 0;

  return (
    <div className="space-y-6">
      {/* Loading Progress Bar */}
      {/* {showProgressBar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Loading dashboard data...</span>
            <span className="font-medium">{Math.round(loadingProgress)}%</span>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </div>
      )} */}

      {/* Status Bar */}
      {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <span className={`flex items-center space-x-1 text-xs font-medium ${statusInfo.color}`}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.text}</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          {connectionStatus === 'connected' && (
            <span className="text-green-600 font-medium">⚡ Optimized</span>
          )}
        </div>
      </div> */}

      {/* Info message if all values are zero */}
      {allZero && !isLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="mb-4">
            <div className="text-4xl mb-2">🚀</div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Welcome to Your Dashboard!
            </h3>
            <p className="text-blue-700 mb-4">
              Start by adding inventory items, creating prescriptions, or generating bills to see your stats come to life.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:scale-105 transition-all duration-200">
                📦 Add Inventory
              </Button>
            </Link>
            <Link to="/billing">
              <Button variant="outline" size="sm" className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:scale-105 transition-all duration-200">
                💰 Create Bill
              </Button>
            </Link>
            <Link to="/prescriptions">
              <Button variant="outline" size="sm" className="bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200 hover:scale-105 transition-all duration-200">
                📋 Add Prescription
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-50">
        {statCards.map((card, index) => {
          const CardWrapper = card.link ? Link : 'div';
          return (
            <CardWrapper
              key={index}
              to={card.link || '#'}
              className={cn(
                "block",
                card.className
              )}
            >
              <Card className={cn(
                "h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0",
                card.bgColor
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    {card.title}
                  </CardTitle>
                  <div className={cn(
                    "text-2xl p-2 rounded-lg bg-white/50",
                    card.iconColor
                  )}>
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {isLoading && !allZero ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {/* Main value display */}
                      {card.title === "Total Revenue" || card.title === "Inventory Value" ? (
                        <div className="text-3xl font-bold text-gray-900 tracking-tight">
                          {formatCurrency(card.value)}
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-gray-900 tracking-tight flex items-baseline space-x-1">
                          <AnimatedCounter value={Math.floor(card.value)} decimalPrecision={0} />
                          <span className="text-sm font-normal text-gray-600">units</span>
                        </div>
                      )}
                      
                      {/* Performance indicator for each card */}
                      {connectionStatus === 'connected' && (
                        <div className="flex items-center space-x-1 text-xs text-green-600">
                          <span>⚡</span>
                          <span>Live data</span>
                        </div>
                      )}
                      
                      {card.link && (
                        <div className="text-xs text-gray-500 mt-1">
                          Click to view details →
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      {/* Performance Tips */}
      {connectionStatus === 'slow' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Slow Connection Detected</p>
              <p className="text-yellow-700 mt-1">
                Data is loading from cache. For faster performance, check your internet connection.
              </p>
            </div>
          </div>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">🔴</span>
            <div className="text-sm">
              <p className="font-medium text-red-800">Connection Issues</p>
              <p className="text-red-700 mt-1">
                Displaying cached data. Please check your internet connection and refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
