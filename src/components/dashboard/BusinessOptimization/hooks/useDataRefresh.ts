
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { stableToast } from "@/components/ui/stable-toast";

interface UseDataRefreshOptions {
  refreshData: () => void;
  refreshLocationData: () => void;
  onError?: (error: any) => void;
  autoRefreshInterval?: number; // in milliseconds
}

export function useDataRefresh({
  refreshData,
  refreshLocationData,
  onError,
  autoRefreshInterval = 10 * 60 * 1000 // Default 10 minutes
}: UseDataRefreshOptions) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);
  const refreshInProgress = useRef(false);
  const renderAttempts = useRef(0);
  const { toast } = useToast();
  
  // Setup auto-refresh interval for real-time forecasting
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      console.log("Auto-refresh triggered after interval");
      setIsAutoRefreshing(true);
      handleRefreshAll(true).finally(() => {
        setIsAutoRefreshing(false);
      });
    }, autoRefreshInterval);
    
    return () => clearInterval(autoRefreshTimer);
  }, [autoRefreshInterval]);
  
  const checkDailyRefresh = useCallback(() => {
    const lastRefreshStr = localStorage.getItem('lastOptimizationRefresh');
    const now = new Date();
    
    if (!lastRefreshStr) {
      // First time, set the refresh date
      localStorage.setItem('lastOptimizationRefresh', now.toISOString());
      return;
    }
    
    const lastRefreshDate = new Date(lastRefreshStr);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastRefreshDay = new Date(lastRefreshDate.getFullYear(), lastRefreshDate.getMonth(), lastRefreshDate.getDate());
    
    // If the last refresh was before today, refresh the data
    if (lastRefreshDay < today) {
      console.log("Daily refresh triggered");
      handleRefreshAll();
      localStorage.setItem('lastOptimizationRefresh', now.toISOString());
    }
  }, []);
  
  const handleRefreshAll = useCallback(async (isAutoRefresh = false) => {
    // Prevent multiple refresh attempts in quick succession
    if (refreshInProgress.current) {
      if (!isAutoRefresh) {
        stableToast({
          title: "Refresh in progress",
          description: "Please wait while we load your data...",
          duration: 2000
        });
      }
      return;
    }
    
    console.log(isAutoRefresh ? "Auto refresh triggered" : "Manual refresh triggered");
    refreshInProgress.current = true;
    
    try {
      // Call the refresh functions
      await Promise.all([
        Promise.resolve(refreshData()),
        Promise.resolve(refreshLocationData())
      ]);
      
      setLastRefreshed(new Date());
      renderAttempts.current = 0;
      
      // Store the refresh time for daily refresh checks
      localStorage.setItem('lastOptimizationRefresh', new Date().toISOString());
      
      if (!isAutoRefresh) {
        toast({
          title: "Refreshing all data",
          description: "Updating analytics with latest business data...",
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      if (onError) {
        onError(error);
      }
      
      if (!isAutoRefresh) {
        stableToast({
          title: "Refresh failed",
          description: "There was a problem refreshing your data. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      // Set a timeout to reset the refreshInProgress flag after some time
      setTimeout(() => {
        refreshInProgress.current = false;
      }, 5000);
    }
  }, [refreshData, refreshLocationData, toast, onError]);

  // Create a handler specifically for button click events that ignores the event
  const handleManualRefresh = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handleRefreshAll(false);
  }, [handleRefreshAll]);

  // Run the check on mount
  useEffect(() => {
    checkDailyRefresh();
  }, [checkDailyRefresh]);

  return {
    lastRefreshed,
    handleRefreshAll,
    handleManualRefresh,
    refreshInProgress,
    renderAttempts,
    isAutoRefreshing
  };
}
