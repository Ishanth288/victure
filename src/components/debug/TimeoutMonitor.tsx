/**
 * Timeout Monitor Component
 * Provides real-time monitoring and debugging of timeout operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientTimeoutHandler } from '@/utils/clientTimeoutHandler';
import { UITimeoutManager } from '@/utils/uiTimeoutManager';
import { AlertTriangle, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface TimeoutMonitorProps {
  showDetails?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface OperationInfo {
  id: string;
  duration: number;
  description?: string;
  status: 'pending' | 'success' | 'failed' | 'timeout';
}

export function TimeoutMonitor({ 
  showDetails = false, 
  autoRefresh = true, 
  refreshInterval = 1000 
}: TimeoutMonitorProps) {
  const [stats, setStats] = useState<Record<string, any>>({});
  const [pendingOperations, setPendingOperations] = useState<OperationInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const refreshData = useCallback(() => {
    try {
      const operationStats = ClientTimeoutHandler.getOperationStats();
      const pendingOps = UITimeoutManager.getPendingOperations().map(op => ({
        ...op,
        status: 'pending' as const
      }));
      
      setStats(operationStats);
      setPendingOperations(pendingOps);
      setLastUpdate(new Date());
    } catch (error) {
      console.warn('Error refreshing timeout monitor data:', error);
    }
  }, []);

  useEffect(() => {
    refreshData();
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh, refreshInterval]);

  const handleClearStats = useCallback(() => {
    ClientTimeoutHandler.clearStats();
    refreshData();
  }, [refreshData]);

  const handleAbortAll = useCallback(() => {
    UITimeoutManager.abortAllUIOperations();
    ClientTimeoutHandler.abortAllOperations();
    refreshData();
  }, [refreshData]);

  const getTotalOperations = () => {
    return Object.values(stats).reduce((total: number, stat: any) => {
      return total + (stat.successCount || 0) + (stat.failureCount || 0);
    }, 0);
  };

  const getAverageSuccessRate = () => {
    const rates = Object.values(stats).map((stat: any) => stat.successRate || 0);
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'timeout':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (!isVisible && !showDetails) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Clock className="h-4 w-4 mr-2" />
        Timeout Monitor
      </Button>
    );
  }

  return (
    <Card className={`${showDetails ? '' : 'fixed bottom-4 right-4 z-50 w-96'} shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeout Monitor
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {!showDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{getTotalOperations()}</div>
            <div className="text-sm text-muted-foreground">Total Operations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{getAverageSuccessRate().toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Pending Operations */}
        {pendingOperations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Operations ({pendingOperations.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pendingOperations.map((op) => (
                <div key={op.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(op.status)}
                    <span className="text-sm">{op.description || 'Unknown'}</span>
                  </div>
                  <Badge variant="outline">{formatDuration(op.duration)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operation Statistics */}
        {Object.keys(stats).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Operation Statistics</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(stats).map(([operation, stat]: [string, any]) => (
                <div key={operation} className="p-2 bg-muted rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{operation}</span>
                    <Badge 
                      variant={stat.successRate > 90 ? 'default' : stat.successRate > 70 ? 'secondary' : 'destructive'}
                    >
                      {stat.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Success: {stat.successCount}</span>
                    <span>Failed: {stat.failureCount}</span>
                    <span>Avg: {formatDuration(stat.averageDuration)}</span>
                  </div>
                  <Progress 
                    value={stat.successRate} 
                    className="h-1 mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {Object.keys(stats).length === 0 && pendingOperations.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No timeout operations detected. The monitor will update automatically as operations occur.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearStats}
            className="flex-1"
          >
            Clear Stats
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleAbortAll}
            className="flex-1"
            disabled={pendingOperations.length === 0}
          >
            Abort All
          </Button>
        </div>

        {/* Debug Info */}
        {showDetails && (
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
              {JSON.stringify({ stats, pendingOperations }, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook for timeout monitoring in components
 */
export function useTimeoutMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getStats = useCallback(() => {
    return ClientTimeoutHandler.getOperationStats();
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        setStats(getStats());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring, getStats]);

  return {
    isMonitoring,
    stats,
    startMonitoring,
    stopMonitoring,
    getStats
  };
}

export default TimeoutMonitor;