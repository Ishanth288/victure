
import { useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { stableToast } from "@/components/ui/stable-toast";

interface UseDataRefreshOptions {
  refreshData: () => void;
  refreshLocationData: () => void;
  onError?: (error: any) => void;
}

export function useDataRefresh({
  refreshData,
  refreshLocationData,
  onError
}: UseDataRefreshOptions) {
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const refreshInProgress = useRef(false);
  const renderAttempts = useRef(0);
  const { toast } = useToast();
  
  // Fix: Use useEffect instead of useState to avoid the 'l' variable initialization error
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
  
  const handleRefreshAll = useCallback(() => {
    // Prevent multiple refresh attempts in quick succession
    if (refreshInProgress.current) {
      stableToast({
        title: "Refresh in progress",
        description: "Please wait while we load your data...",
        duration: 2000
      });
      return;
    }
    
    console.log("Manual refresh triggered");
    refreshInProgress.current = true;
    
    // Set a timeout to reset the refreshInProgress flag after some time
    setTimeout(() => {
      refreshInProgress.current = false;
    }, 5000);
    
    try {
      // Call the refresh functions
      refreshData();
      refreshLocationData();
      setLastRefreshed(new Date());
      renderAttempts.current = 0;
      
      // Store the refresh time for daily refresh checks
      localStorage.setItem('lastOptimizationRefresh', new Date().toISOString());
      
      toast({
        title: "Refreshing all data",
        description: "Updating analytics with Google Trends and news data...",
        duration: 3000
      });
    } catch (error) {
      console.error("Error during refresh:", error);
      refreshInProgress.current = false;
      if (onError) {
        onError(error);
      }
      
      stableToast({
        title: "Refresh failed",
        description: "There was a problem refreshing your data. Please try again.",
        variant: "destructive"
      });
    }
  }, [refreshData, refreshLocationData, toast, onError]);

  // Run the check on mount
  checkDailyRefresh();

  return {
    lastRefreshed,
    handleRefreshAll,
    refreshInProgress,
    renderAttempts
  };
}
