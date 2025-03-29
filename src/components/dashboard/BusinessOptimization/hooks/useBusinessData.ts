
import { useState, useCallback, useRef, useEffect } from "react";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { useBusinessDataFetch, ErrorType } from "./useBusinessDataFetch";
import { useRealtimeUpdates } from "./useRealtimeUpdates";

interface UseBusinessDataOptions {
  onError?: () => void;
  maxRetries?: number;
  timeout?: number;
}

export function useBusinessData(options?: UseBusinessDataOptions) {
  const [error, setError] = useState<boolean>(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const mountedRef = useRef(true);
  const connectionError = useRef<string | null>(null);
  
  const handleDataError = useCallback(() => {
    console.log("Business data error callback triggered");
    setError(true);
  }, []);
  
  // Get location data with optimized loading
  const { 
    locationData, 
    pharmacyLocation, 
    refreshData: refreshLocationData, 
    isLoading: locationLoading,
    error: locationError
  } = useLocationBasedAnalytics();

  // Get business data with optimized loading
  const inventoryResult = useBusinessDataFetch('inventory');
  const salesResult = useBusinessDataFetch('bills');  
  const suppliersResult = useBusinessDataFetch('purchase_orders');
  
  // Set up combined data
  const isLoading = inventoryResult.isLoading || salesResult.isLoading || suppliersResult.isLoading;
  const inventoryData = inventoryResult.data;
  const salesData = salesResult.data;
  const suppliersData = suppliersResult.data;
  
  // Handle any errors
  useEffect(() => {
    if (inventoryResult.error || salesResult.error || suppliersResult.error) {
      connectionError.current = inventoryResult.error || salesResult.error || suppliersResult.error || "Unknown error";
      setError(true);
      options?.onError?.();
    }
  }, [inventoryResult.error, salesResult.error, suppliersResult.error, options]);
  
  // Track if data has been fetched
  useEffect(() => {
    if (!isLoading && (inventoryData || salesData || suppliersData)) {
      setDataFetched(true);
    }
  }, [isLoading, inventoryData, salesData, suppliersData]);

  // Combined fetch function
  const fetchData = useCallback(() => {
    console.log("Fetching all business data");
    inventoryResult.refetch();
    salesResult.refetch();
    suppliersResult.refetch();
    setDataFetched(false);
  }, [inventoryResult, salesResult, suppliersResult]);

  // Retry function with backoff
  const retryFetch = useCallback(() => {
    console.log("Retrying business data fetch");
    setTimeout(fetchData, 1000);
  }, [fetchData]);

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
    
    // Only proceed when location data is loaded (or failed) with a small delay
    if (!locationLoading && !isLoading && !dataFetched) {
      const timer = setTimeout(() => {
        console.log("Location data loaded, now fetching business data");
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
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

  // Determine error type based on results
  const errorType: ErrorType = 
    inventoryResult.errorType !== 'unknown' ? inventoryResult.errorType :
    salesResult.errorType !== 'unknown' ? salesResult.errorType :
    suppliersResult.errorType !== 'unknown' ? suppliersResult.errorType : 
    'unknown';

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
    connectionError: connectionError.current,
    errorType,
    hasError: Boolean(connectionError.current) || Boolean(locationError) || error,
    autoRefreshEnabled,
    dataFetched,
    setDataFetched,
    retryFetch
  };
}
