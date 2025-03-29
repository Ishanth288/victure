
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

  return {
    lastRefreshed,
    handleRefreshAll,
    refreshInProgress,
    renderAttempts
  };
}
