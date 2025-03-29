
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { checkSupabaseConnection, executeWithRetry, determineErrorType } from "@/utils/supabaseErrorHandling";
import { User } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";

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
  const { toast } = useToast();
  const retryCount = useRef(0);
  const maxRetries = useRef(3);
  const mountedRef = useRef(true);
  const { 
    locationData, 
    pharmacyLocation, 
    refreshData: refreshLocationData, 
    isLoading: locationLoading,
    error: locationError
  } = useLocationBasedAnalytics() as { 
    locationData: any; 
    pharmacyLocation: any; 
    refreshData: () => Promise<any>; 
    isLoading: boolean;
    error: any;
  };

  const fetchData = useCallback(async () => {
    // Don't update state if the component has unmounted
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      // Check connection first
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error("Database connection failed. Please check your network connection.");
      }

      // Get the current user
      const userResult = await executeWithRetry(
        () => supabase.auth.getUser(),
        { 
          context: "getUser",
          retries: 3,
          retryDelay: 1000
        }
      );
      
      if (userResult.error || !userResult.data?.user) {
        if (userResult.error) {
          throw userResult.error;
        } else {
          throw new Error("User not authenticated");
        }
      }
      
      const user = userResult.data.user;

      // Fetch inventory data with retry logic
      const inventoryResult = await executeWithRetry(
        () => supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id),
        { 
          context: "inventory",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (inventoryResult.error) throw inventoryResult.error;

      // Fetch sales data from bills with retry logic
      const billsResult = await executeWithRetry(
        () => supabase
          .from('bills')
          .select('*, bill_items(*)')
          .eq('user_id', user.id),
        { 
          context: "bills",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (billsResult.error) throw billsResult.error;

      // Fetch supplier data from purchase orders with retry logic
      const purchaseOrdersResult = await executeWithRetry(
        () => supabase
          .from('purchase_orders')
          .select('*, purchase_order_items(*)')
          .eq('user_id', user.id),
        { 
          context: "purchase_orders",
          retries: 3,
          retryDelay: 1000
        }
      );

      if (purchaseOrdersResult.error) throw purchaseOrdersResult.error;

      // Don't update state if the component has unmounted
      if (!mountedRef.current) return;
      
      if (inventoryResult.data) {
        setInventoryData(inventoryResult.data as any[]);
      }

      if (billsResult.data) {
        setSalesData(billsResult.data as any[]);
      }

      if (purchaseOrdersResult.data) {
        setSuppliersData(purchaseOrdersResult.data as any[]);
      }
      
      // Reset retry counter on success
      retryCount.current = 0;
      
      // Show success message if recovering from previous error
      if (connectionError) {
        toast({
          title: "Connection restored",
          description: "Business optimization data has been refreshed",
          duration: 3000
        });
        setConnectionError(null);
      }
    } catch (error: any) {
      console.error("Error fetching business data:", error);
      
      // Don't update state if the component has unmounted
      if (!mountedRef.current) return;
      
      // Determine error type for UI display
      const detectedErrorType = determineErrorType(error);
      setErrorType(detectedErrorType);
      
      // Set error message
      setConnectionError(error.message || "Unknown error occurred");
      
      // Implement exponential backoff retry
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
        toast({
          title: "Error fetching data",
          description: "There was a problem loading your business data. Please try again.",
          variant: "destructive"
        });
        
        // Call onError callback if provided
        if (options?.onError) {
          options.onError();
        }
      }
    } finally {
      // Don't update state if the component has unmounted
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast, options, connectionError]);

  useEffect(() => {
    // Set mounted ref to true
    mountedRef.current = true;
    
    // Fetch data on mount
    fetchData();
    
    // Set up real-time subscriptions
    const setupSubscriptions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        if (!user) return () => {};
        
        // Create a channel for data updates
        const channel = supabase
          .channel('business-data-changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Inventory data changed, refreshing...');
              fetchData();
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Bills data changed, refreshing...');
              fetchData();
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'purchase_orders', filter: `user_id=eq.${user.id}` }, 
            () => {
              console.log('Purchase orders data changed, refreshing...');
              fetchData();
            }
          )
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
            () => {
              console.log('Profile data changed, refreshing location data...');
              refreshLocationData();
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
    
    // Handle online/offline events
    const handleOnline = () => {
      console.log("App is back online, refreshing business data...");
      fetchData();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      mountedRef.current = false;
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
  };
}
