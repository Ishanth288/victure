
import { useState, useCallback, useRef, useEffect } from "react";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { useBusinessDataFetch } from "./useBusinessDataFetch";
import { useRealtimeUpdates } from "./useRealtimeUpdates";

interface UseBusinessDataOptions {
  onError?: () => void;
  maxRetries?: number;
  timeout?: number;
}

export function useBusinessData(options?: UseBusinessDataOptions) {
  const [error, setError] = useState<boolean>(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const mountedRef = useRef(true);
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
  }, []);
  
  // Get location data
  const { 
    locationData, 
    pharmacyLocation, 
    refreshData: refreshLocationData, 
    isLoading: locationLoading,
    error: locationError
  } = useLocationBasedAnalytics();

  // Get business data
  const {
    isLoading, 
    inventoryData, 
    salesData, 
    suppliersData,
    connectionError,
    errorType,
    dataFetched,
    setDataFetched,
    fetchData
  } = useBusinessDataFetch({
    onError: options?.onError || handleDataError,
    mountedRef,
    maxRetries: options?.maxRetries,
    timeout: options?.timeout
  });

  // Set up realtime updates
  useRealtimeUpdates({
    fetchData,
    refreshLocationData,
    dataFetched,
    mountedRef
  });

  // Ensure location data is loaded first
  useEffect(() => {
    console.log("Location data effect triggered", { locationLoading, locationData: !!locationData });
    
    // Only proceed when location data is loaded (or failed)
    if (!locationLoading && !isLoading && !dataFetched) {
      console.log("Location data loaded, now fetching business data");
      fetchData();
    }
  }, [locationLoading, isLoading, dataFetched, fetchData, locationData]);

  // Handle component mount/unmount
  useEffect(() => {
    console.log("Main useEffect triggered in useBusinessData");
    mountedRef.current = true;
    
    return () => {
      console.log("Cleanup function triggered in useBusinessData");
      mountedRef.current = false;
    };
  }, []);

  return {
    isLoading,
    locationLoading,
    inventoryData,
    salesData,
    suppliersData,
    locationData,
    pharmacyLocation,
    refreshData: fetchData,
    refreshLocationData,
    connectionError,
    errorType,
    hasError: Boolean(connectionError) || Boolean(locationError) || error,
    autoRefreshEnabled
  };
}
