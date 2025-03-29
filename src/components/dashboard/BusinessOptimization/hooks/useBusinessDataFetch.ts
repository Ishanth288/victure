
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection, executeWithRetry, determineErrorType } from "@/utils/supabaseErrorHandling";

interface UseBusinessDataFetchOptions {
  onError?: () => void;
  mountedRef: React.MutableRefObject<boolean>;
}

export function useBusinessDataFetch({ onError, mountedRef }: UseBusinessDataFetchOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'connection' | 'database' | 'server' | 'unknown'>('unknown');
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();
  const retryCount = useRef(0);
  const maxRetries = useRef(3);
  const lastFetchTime = useRef<Date>(new Date());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        
        if (onError) {
          onError();
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
        
        if (onError) {
          onError();
        }
        
        // Even after error, we need to exit loading state to prevent infinite spinner
        setIsLoading(false);
        setDataFetched(true);
      }
    }
  }, [toast, onError, connectionError, mountedRef, isLoading]);

  // Clean up function
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    isLoading,
    inventoryData,
    salesData,
    suppliersData,
    connectionError,
    errorType,
    dataFetched,
    setDataFetched,
    fetchData
  };
}
