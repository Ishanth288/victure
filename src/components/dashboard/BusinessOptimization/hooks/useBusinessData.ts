
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { checkSupabaseConnection, executeWithRetry, determineErrorType } from "@/utils/supabaseErrorHandling";

interface PharmacyLocation {
  state?: string;
  city?: string;
  [key: string]: any;
}

interface UseBusinessDataOptions {
  onError?: () => void;
}

export function useBusinessData(options?: UseBusinessDataOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'connection' | 'database' | 'server' | 'unknown'>('unknown');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const { toast } = useToast();
  const retryCount = useRef(0);
  const maxRetries = useRef(3);
  const mountedRef = useRef(true);
  const [dataFetched, setDataFetched] = useState(false);
  const lastFetchTime = useRef<Date>(new Date());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Critical fix: Add error property to properly handle location loading errors
  const { 
    locationData, 
    pharmacyLocation, 
    refreshData: refreshLocationData, 
    isLoading: locationLoading,
    error: locationError
  } = useLocationBasedAnalytics();

  console.log("useBusinessData hook initialized", { 
    isLoading, 
    locationLoading, 
    dataFetched,
    inventoryData: inventoryData?.length || 0,
    salesData: salesData?.length || 0,
    suppliersData: suppliersData?.length || 0,
    locationData: locationData ? 'available' : 'not available',
    autoRefreshEnabled,
    lastFetch: lastFetchTime.current.toLocaleString(),
    timeSinceLastFetch: new Date().getTime() - lastFetchTime.current.getTime()
  });

  const fetchData = useCallback(async () => {
    console.log("fetchData function triggered, checking mountedRef:", mountedRef.current);
    if (!mountedRef.current) return;
    
    // Set a timeout to prevent infinite loading
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.log("Fetch timeout reached, exiting loading state");
        setIsLoading(false);
        setDataFetched(true);
        
        if (options?.onError) {
          options.onError();
        }
      }
    }, 15000); // 15 second timeout
    
    // Record the time of this fetch
    lastFetchTime.current = new Date();
    
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const isConnected = await checkSupabaseConnection();
      console.log("Connection check result:", isConnected);
      
      if (!isConnected) {
        throw new Error("Database connection failed. Please check your network connection.");
      }

      console.log("Getting user...");
      const userResult = await executeWithRetry(
        () => supabase.auth.getUser(),
        { 
          context: "getUser",
          retries: 3,
          retryDelay: 1000
        }
      );
      
      if (userResult.error || !userResult.data?.user) {
        console.error("User authentication error:", userResult.error);
        if (userResult.error) {
          throw userResult.error;
        } else {
          throw new Error("User not authenticated");
        }
      }
      
      const user = userResult.data.user;
      console.log("User authenticated, fetching inventory data...");

      // Execute inventory query inside an async function
      const inventoryPromise = async () => {
        console.log("Fetching inventory data...");
        const result = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id);
        console.log("Inventory query result:", result);
        return result;
      };

      const inventoryResult = await executeWithRetry(
        inventoryPromise,
        { 
          context: "inventory",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (inventoryResult.error) {
        console.error("Inventory query error:", inventoryResult.error);
        throw inventoryResult.error;
      }

      console.log("Fetching bills data...");
      // Execute bills query inside an async function
      const billsPromise = async () => {
        const result = await supabase
          .from('bills')
          .select('*, bill_items(*)')
          .eq('user_id', user.id);
        console.log("Bills query result:", result);
        return result;
      };

      const billsResult = await executeWithRetry(
        billsPromise,
        { 
          context: "bills",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (billsResult.error) {
        console.error("Bills query error:", billsResult.error);
        throw billsResult.error;
      }

      console.log("Fetching purchase orders data...");
      // Execute purchase orders query inside an async function
      const purchaseOrdersPromise = async () => {
        const result = await supabase
          .from('purchase_orders')
          .select('*, purchase_order_items(*)')
          .eq('user_id', user.id);
        console.log("Purchase orders query result:", result);
        return result;
      };

      const purchaseOrdersResult = await executeWithRetry(
        purchaseOrdersPromise,
        { 
          context: "purchase_orders",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (purchaseOrdersResult.error) {
        console.error("Purchase orders query error:", purchaseOrdersResult.error);
        throw purchaseOrdersResult.error;
      }

      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        console.log("Component unmounted, stopping state updates");
        return;
      }
      
      // Clear fetch timeout since we've successfully fetched data
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      console.log("Setting inventory data:", inventoryResult.data?.length || 0, "items");
      if (inventoryResult.data) {
        setInventoryData(inventoryResult.data as any[]);
      }

      console.log("Setting sales data:", billsResult.data?.length || 0, "items");
      if (billsResult.data) {
        setSalesData(billsResult.data as any[]);
      }

      console.log("Setting suppliers data:", purchaseOrdersResult.data?.length || 0, "items");
      if (purchaseOrdersResult.data) {
        setSuppliersData(purchaseOrdersResult.data as any[]);
      }
      
      retryCount.current = 0;
      setDataFetched(true);
      
      if (connectionError) {
        toast({
          title: "Connection restored",
          description: "Business optimization data has been refreshed",
          duration: 3000
        });
        setConnectionError(null);
      }
      
      console.log("Data fetching completed, setting isLoading to false");
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error fetching business data:", error);
      
      if (!mountedRef.current) return;
      
      const detectedErrorType = determineErrorType(error);
      setErrorType(detectedErrorType);
      
      setConnectionError(error.message || "Unknown error occurred");
      
      if (retryCount.current < maxRetries.current) {
        retryCount.current++;
        const delay = 1000 * Math.pow(2, retryCount.current - 1);
        console.log(`Retrying data fetch (${retryCount.current}/${maxRetries.current}) after ${delay}ms`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData();
          }
        }, delay);
      } else {
        console.log("Max retries reached, setting error state");
        toast({
          title: "Error fetching data",
          description: "There was a problem loading your business data. Please try again.",
          variant: "destructive"
        });
        
        if (options?.onError) {
          options.onError();
        }
        
        // Even after error, we need to exit loading state to prevent infinite spinner
        setIsLoading(false);
        setDataFetched(true);
      }
    }
  }, [toast, options, connectionError]);

  // Ensure location data is loaded first
  useEffect(() => {
    console.log("Location data effect triggered", { locationLoading, locationData: !!locationData });
    
    // Only proceed when location data is loaded (or failed)
    if (!locationLoading && !isLoading && !dataFetched) {
      console.log("Location data loaded, now fetching business data");
      fetchData();
    }
  }, [locationLoading, isLoading, dataFetched, fetchData]);

  useEffect(() => {
    console.log("Main useEffect triggered in useBusinessData");
    mountedRef.current = true;
    
    // Start with fetching location data, business data will follow in the other effect
    
    const setupSubscriptions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        if (!user) return () => {};
        
        console.log("Setting up realtime subscriptions for user:", user.id);
        const channel = supabase
          .channel('business-data-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Inventory data changed through database update');
              // We only refresh automatically if the data was actually changed in the database,
              // not just because the component loaded
              if (mountedRef.current && dataFetched) {
                toast({
                  title: "Inventory Updated",
                  description: "Your inventory data has been updated",
                  duration: 3000
                });
                fetchData();
              }
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Bills data changed through database update');
              // Only refresh if an actual database update happened
              if (mountedRef.current && dataFetched) {
                toast({
                  title: "Sales Data Updated",
                  description: "Your sales data has been updated",
                  duration: 3000
                });
                fetchData();
              }
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'purchase_orders', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Purchase orders data changed through database update');
              // Only refresh if an actual database update happened
              if (mountedRef.current && dataFetched) {
                toast({
                  title: "Purchase Orders Updated",
                  description: "Your purchase order data has been updated",
                  duration: 3000
                });
                fetchData();
              }
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
            () => {
              console.log('Profile data changed, refreshing location data...');
              if (mountedRef.current && dataFetched) {
                refreshLocationData();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to realtime updates for business data');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to realtime updates for business data');
              // Don't trigger full error state for subscription errors
              // just log them and the page will still work with manual refresh
            }
          });
          
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error setting up realtime subscriptions:", error);
        return () => {};
      }
    };
    
    const cleanup = setupSubscriptions();
    
    const handleOnline = () => {
      console.log("App is back online, refreshing business data...");
      fetchData();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      console.log("Cleanup function triggered in useBusinessData");
      mountedRef.current = false;
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      if (cleanup) cleanup.then(unsub => unsub && unsub());
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchData, refreshLocationData]);

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
    hasError: Boolean(connectionError) || Boolean(locationError),
    autoRefreshEnabled
  };
}
