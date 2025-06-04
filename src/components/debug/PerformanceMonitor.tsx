import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mobileOptimizer, isMobileDevice } from '@/utils/mobileOptimizer';
import { realTimeOptimizer } from '@/utils/realTimeOptimizer';
import { Activity, Smartphone, Wifi, Battery, Eye, EyeOff } from 'lucide-react';

interface PerformanceMetrics {
  mobile: {
    isOptimized: boolean;
    metrics: any;
  };
  realTime: {
    isConnected: boolean;
    channelCount: number;
  };
  general: {
    memoryUsage?: number;
    loadTime: number;
    isMobile: boolean;
  };
}

export function PerformanceMonitor() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    mobile: { isOptimized: false, metrics: {} },
    realTime: { isConnected: false, channelCount: 0 },
    general: { loadTime: 0, isMobile: false }
  });

  // Hide on index and auth pages
  const shouldHide = location.pathname === '/' || location.pathname === '/auth';

  // Only show in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    localStorage.getItem('victure-debug') === 'true';

  useEffect(() => {
    if (!shouldShow || shouldHide) return;

    const updateMetrics = () => {
      const mobileStatus = mobileOptimizer.getStatus();
      const rtStatus = realTimeOptimizer.getConnectionStatus();
      
      setMetrics({
        mobile: mobileStatus,
        realTime: rtStatus,
        general: {
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          loadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0,
          isMobile: isMobileDevice()
        }
      });
    };

    // Update immediately
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [shouldShow, shouldHide]);

  if (!shouldShow || shouldHide) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatMs = (ms: number) => {
    return (ms / 1000).toFixed(2) + 's';
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 bg-white shadow-lg"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="ml-2">Performance</span>
      </Button>

      {/* Metrics Panel */}
      {isVisible && (
        <Card className="w-80 shadow-xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              Performance Monitor
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 text-sm">
            {/* Mobile Optimizations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Smartphone className="h-3 w-3 mr-2" />
                  Mobile Optimizations
                </span>
                <Badge variant={metrics.mobile.isOptimized ? "default" : "secondary"}>
                  {metrics.mobile.isOptimized ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {metrics.general.isMobile && (
                <div className="pl-5 space-y-1 text-gray-600">
                  <div>Device: Mobile</div>
                  <div>Reduced Motion: {metrics.mobile.metrics.prefersReducedMotion ? "Yes" : "No"}</div>
                  <div>Page Visible: {metrics.mobile.metrics.isVisible ? "Yes" : "No"}</div>
                </div>
              )}
            </div>

            {/* Real-time Connections */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Wifi className="h-3 w-3 mr-2" />
                  Real-time
                </span>
                <Badge variant={metrics.realTime.isConnected ? "default" : "destructive"}>
                  {metrics.realTime.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              <div className="pl-5 text-gray-600">
                <div>Active Channels: {metrics.realTime.channelCount}</div>
              </div>
            </div>

            {/* General Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <Battery className="h-3 w-3 mr-2" />
                  General
                </span>
                <Badge variant="outline">Monitor</Badge>
              </div>
              
              <div className="pl-5 space-y-1 text-gray-600">
                {metrics.general.memoryUsage > 0 && (
                  <div>Memory: {formatBytes(metrics.general.memoryUsage)}</div>
                )}
                {metrics.general.loadTime > 0 && (
                  <div>Load Time: {formatMs(metrics.general.loadTime)}</div>
                )}
                <div>Platform: {metrics.general.isMobile ? "Mobile" : "Desktop"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Enable debug mode
export function enableDebugMode() {
  localStorage.setItem('victure-debug', 'true');
  console.log('🐛 Debug mode enabled. Refresh the page to see performance monitor.');
}

// Disable debug mode
export function disableDebugMode() {
  localStorage.setItem('victure-debug', 'false');
  console.log('✅ Debug mode disabled.');
} 