
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationBasedAnalytics, LocationAnalyticsData } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { checkSupabaseConnection, executeWithRetry, determineErrorType } from "@/utils/supabaseErrorHandling";
import { User } from "@supabase/supabase-js";
import { PostgrestError } from "@supabase/supabase-js";

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
  } = useLocationBasedAnalytics();

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error("Database connection failed. Please check your network connection.");
      }

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

      // Fix the inventory query by wrapping it in a proper async function
      const inventoryPromise = async () => {
        const result = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id);
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

      if (inventoryResult.error) throw inventoryResult.error;

      // Fix the bills query by wrapping it in a proper async function
      const billsPromise = async () => {
        const result = await supabase
          .from('bills')
          .select('*, bill_items(*)')
          .eq('user_id', user.id);
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

      if (billsResult.error) throw billsResult.error;

      // Fix the purchase orders query by wrapping it in a proper async function
      const purchaseOrdersPromise = async () => {
        const result = await supabase
          .from('purchase_orders')
          .select('*, purchase_order_items(*)')
          .eq('user_id', user.id);
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

      if (purchaseOrdersResult.error) throw purchaseOrdersResult.error;

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
      
      retryCount.current = 0;
      
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
        toast({
          title: "Error fetching data",
          description: "There was a problem loading your business data. Please try again.",
          variant: "destructive"
        });
        
        if (options?.onError) {
          options.onError();
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast, options, connectionError]);

  useEffect(() => {
    mountedRef.current = true;
    
    fetchData();
    
    const setupSubscriptions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        if (!user) return () => {};
        
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
