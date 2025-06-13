import { useEffect, useState } from 'react';
import { connectionManager } from '@/utils/connectionManager';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isOnline: boolean;
  supabaseConnected: boolean;
  lastCheck: Date;
  errorCount: number;
}

export function ConnectionHealthMonitor() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    supabaseConnected: false,
    lastCheck: new Date(),
    errorCount: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout;
    let errorCount = 0;

    const checkConnectionHealth = async () => {
      if (!mounted) return;

      try {
        const isOnline = navigator.onLine;
        const supabaseConnected = await connectionManager.checkConnection();
        
        if (!supabaseConnected) {
          errorCount++;
        } else {
          errorCount = Math.max(0, errorCount - 1); // Gradually reduce error count on success
        }

        setStatus({
          isOnline,
          supabaseConnected,
          lastCheck: new Date(),
          errorCount
        });

        // Show monitor if there are connection issues
        setIsVisible(!isOnline || !supabaseConnected || errorCount > 2);
      } catch (error) {
        console.warn('Connection health check failed:', error);
        errorCount++;
        setStatus(prev => ({ ...prev, errorCount, lastCheck: new Date() }));
      }
    };

    // Initial check
    checkConnectionHealth();

    // Set up periodic health checks
    checkInterval = setInterval(checkConnectionHealth, 10000); // Check every 10 seconds

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      checkConnectionHealth();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkConnectionHealth();
    });

    return () => {
      mounted = false;
      clearInterval(checkInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      subscription.unsubscribe();
    };
  }, []);

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-red-500';
    if (!status.supabaseConnected) return 'bg-amber-500';
    if (status.errorCount > 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (!status.supabaseConnected) return 'Database Disconnected';
    if (status.errorCount > 2) return 'Connection Issues';
    return 'Connected';
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">
              Connection Status: {getStatusText()}
            </h4>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div>Network: {status.isOnline ? '✅ Online' : '❌ Offline'}</div>
              <div>Database: {status.supabaseConnected ? '✅ Connected' : '❌ Disconnected'}</div>
              {status.errorCount > 0 && (
                <div>Errors: {status.errorCount}</div>
              )}
              <div>Last check: {status.lastCheck.toLocaleTimeString()}</div>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ×
          </button>
        </div>
        
        {(!status.isOnline || !status.supabaseConnected) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={async () => {
                console.log('Manual reconnection attempt...');
                await connectionManager.attemptReconnect();
              }}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}