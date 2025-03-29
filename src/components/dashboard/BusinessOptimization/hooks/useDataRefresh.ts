
import { useState, useCallback, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";

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
  const renderAttempts = useRef(0);
  const { toast } = useToast();
  
  const handleRefreshAll = useCallback(() => {
    console.log("Manual refresh triggered");
    refreshData();
    refreshLocationData();
    setLastRefreshed(new Date());
    renderAttempts.current = 0;
    toast({
      title: "Refreshing all data",
      description: "Updating analytics with Google Trends and news data...",
      duration: 3000
    });
  }, [refreshData, refreshLocationData, toast]);

  return {
    lastRefreshed,
    handleRefreshAll,
    renderAttempts
  };
}
