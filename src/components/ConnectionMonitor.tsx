import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { realTimeOptimizer } from '@/utils/realTimeOptimizer';

interface ConnectionStatus {
  isOnline: boolean;
  supabaseConnected: boolean;
  realTimeChannels: number;
  lastConnected: Date | null;
  connectionSpeed: 'fast' | 'slow' | 'unknown';
}

interface ConnectionMonitorProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function ConnectionMonitor({ 
  compact = true, 
  showDetails = false,
  className = ""
}: ConnectionMonitorProps) {
  const location = useLocation();
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    supabaseConnected: false,
    realTimeChannels: 0,
    lastConnected: null,
    connectionSpeed: 'unknown'
  });

  const [isVisible, setIsVisible] = useState(false);

  // Hide on index and auth pages
  const shouldHide = location.pathname === '/' || location.pathname === '/auth';

  // Test Supabase connection
  const testSupabaseConnection = async (): Promise<{ connected: boolean; speed: 'fast' | 'slow' }> => {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      
      const duration = Date.now() - startTime;
      const speed = duration < 2000 ? 'fast' : 'slow';
      
      return { connected: !error, speed };
    } catch (error) {
      console.warn('Supabase connection test failed:', error);
      return { connected: false, speed: 'slow' };
    }
  };

  // Update connection status
  const updateConnectionStatus = async () => {
    const isOnline = navigator.onLine;
    const rtStatus = realTimeOptimizer.getConnectionStatus();
    
    let supabaseConnected = false;
    let connectionSpeed: 'fast' | 'slow' | 'unknown' = 'unknown';
    
    if (isOnline) {
      const supabaseTest = await testSupabaseConnection();
      supabaseConnected = supabaseTest.connected;
      connectionSpeed = supabaseTest.speed;
    }

    setStatus({
      isOnline,
      supabaseConnected,
      realTimeChannels: rtStatus.channelCount,
      lastConnected: supabaseConnected ? new Date() : status.lastConnected,
      connectionSpeed
    });
  };

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Network back online');
      updateConnectionStatus();
    };

    const handleOffline = () => {
      console.log('📴 Network went offline');
      setStatus(prev => ({ ...prev, isOnline: false, supabaseConnected: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status check
    updateConnectionStatus();

    // Periodic status check
    const interval = setInterval(updateConnectionStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Always show monitor when not on hidden pages
  useEffect(() => {
    setIsVisible(!shouldHide);
  }, [shouldHide]);

  const getStatusColor = () => {
    if (!status.isOnline || !status.supabaseConnected) return 'destructive';
    if (status.connectionSpeed === 'slow') return 'secondary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return <WifiOff className="h-3 w-3" />;
    if (!status.supabaseConnected) return <AlertCircle className="h-3 w-3" />;
    if (status.connectionSpeed === 'slow') return <Clock className="h-3 w-3" />;
    return <CheckCircle className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (!status.supabaseConnected) return 'Connection Issues';
    if (status.connectionSpeed === 'slow') return 'Slow Connection';
    return 'Connected';
  };

  if (!isVisible || shouldHide) {
    return null;
  }

  if (compact) {
    return (
      <div className={`fixed bottom-20 left-4 z-40 ${className}`}>
        <Badge 
          variant={getStatusColor()} 
          className={`
            transition-all duration-300 cursor-pointer hover:scale-105
            ${!status.isOnline || !status.supabaseConnected ? 'animate-pulse' : ''}
          `}
          onClick={() => updateConnectionStatus()}
          title="Click to refresh connection status"
        >
          {getStatusIcon()}
          <span className="ml-2">{getStatusText()}</span>
        </Badge>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-20 left-4 z-40 ${className}`}>
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Connection Status</h3>
            <Badge variant={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-2">{getStatusText()}</span>
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
                {status.isOnline ? '✓ Online' : '✗ Offline'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Database:</span>
              <span className={status.supabaseConnected ? 'text-green-600' : 'text-red-600'}>
                {status.supabaseConnected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Speed:</span>
              <span className={
                status.connectionSpeed === 'fast' ? 'text-green-600' : 
                status.connectionSpeed === 'slow' ? 'text-yellow-600' : 'text-gray-500'
              }>
                {status.connectionSpeed === 'fast' ? '⚡ Fast' : 
                 status.connectionSpeed === 'slow' ? '🐌 Slow' : '❓ Unknown'}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Real-time Channels:</span>
              <span className="text-blue-600">{status.realTimeChannels}</span>
            </div>

            {status.lastConnected && (
              <div className="flex justify-between">
                <span>Last Connected:</span>
                <span className="text-gray-600">
                  {status.lastConnected.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <Button 
              onClick={updateConnectionStatus} 
              size="sm" 
              variant="outline" 
              className="w-full"
            >
              <Wifi className="h-3 w-3 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple hook for checking connection status
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isConnected;
} 