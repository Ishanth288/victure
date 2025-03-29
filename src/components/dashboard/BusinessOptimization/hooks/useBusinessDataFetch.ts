
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection, executeWithRetry, determineErrorType } from "@/utils/supabaseErrorHandling";
import { stableToast } from "@/components/ui/stable-toast";

interface UseBusinessDataFetchOptions {
  onError?: () => void;
  mountedRef: React.MutableRefObject<boolean>;
  maxRetries?: number;
  timeout?: number;
}

export function useBusinessDataFetch({ 
  onError, 
  mountedRef, 
  maxRetries = 3,
  timeout = 15000 
}: UseBusinessDataFetchOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'connection' | 'database' | 'server' | 'unknown'>('unknown');
  const [dataFetched, setDataFetched] = useState(false);
  const { toast } = useToast();
  const retryCount = useRef(0);
  const maxRetriesRef = useRef(maxRetries);
  const lastFetchTime = useRef<Date>(new Date());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const fetchInProgress = useRef(false);
  
  // Update maxRetries if it changes
  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  // Simplified retry function that can be called externally 
  // to handle CSP issues or other problems
  const retryFetch = useCallback(() => {
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, not retrying");
      return;
    }
    
    console.log("Manual retry fetch triggered");
    // Reset error state
    setConnectionError(null);
    setErrorType('unknown');
    // Reset retry counter to give it a fresh start
    retryCount.current = 0;
    // Call fetch data
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    console.log("fetchData function triggered, checking mountedRef:", mountedRef.current);
    if (!mountedRef.current) return;
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
    
    fetchInProgress.current = true;
    
    // Create a new AbortController for this fetch operation
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    
    // Set a timeout to prevent infinite loading
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        console.log(`Fetch timeout reached after ${timeout}ms, exiting loading state`);
        if (abortController.current) {
          abortController.current.abort();
        }
        setIsLoading(false);
        setDataFetched(true);
        fetchInProgress.current = false;
        
        stableToast({
          title: "Data loading timeout",
          description: "It's taking longer than expected to load your data. Showing partial results.",
          variant: "destructive"
        });
        
        if (onError) {
          onError();
        }
      }
    }, timeout);
    
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
          retries: 2, // Faster retry but fewer attempts
          retryDelay: 500 // Faster retry
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
          .eq('user_id', user.id)
          .limit(50); // Reduced limit to improve performance
        console.log("Inventory query result:", result);
        return result;
      };

      const inventoryResult = await executeWithRetry(
        inventoryPromise,
        { 
          context: "inventory",
          retries: 2,
          retryDelay: 500
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
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30); // Reduced limit to improve performance
        console.log("Bills query result:", result);
        return result;
      };

      const billsResult = await executeWithRetry(
        billsPromise,
        { 
          context: "bills",
          retries: 2,
          retryDelay: 500
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
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30); // Reduced limit to improve performance
        console.log("Purchase orders query result:", result);
        return result;
      };

      const purchaseOrdersResult = await executeWithRetry(
        purchaseOrdersPromise,
        { 
          context: "purchase_orders",
          retries: 2,
          retryDelay: 500
        }
      );

      if (purchaseOrdersResult.error) {
        console.error("Purchase orders query error:", purchaseOrdersResult.error);
        throw purchaseOrdersResult.error;
      }

      // Check if component is still mounted before updating state
      if (!mountedRef.current) {
        console.log("Component unmounted, stopping state updates");
        fetchInProgress.current = false;
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
        stableToast({
          title: "Connection restored",
          description: "Business optimization data has been refreshed",
          duration: 4000
        });
        setConnectionError(null);
      }
      
      console.log("Data fetching completed, setting isLoading to false");
      setIsLoading(false);
      fetchInProgress.current = false;
    } catch (error: any) {
      console.error("Error fetching business data:", error);
      
      if (!mountedRef.current) {
        fetchInProgress.current = false;
        return;
      }
      
      const detectedErrorType = determineErrorType(error);
      setErrorType(detectedErrorType);
      
      setConnectionError(error.message || "Unknown error occurred");
      
      if (retryCount.current < maxRetriesRef.current) {
        retryCount.current++;
        const delay = 500 * Math.pow(1.5, retryCount.current - 1); // Faster exponential backoff
        console.log(`Retrying data fetch (${retryCount.current}/${maxRetriesRef.current}) after ${delay}ms`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetchInProgress.current = false;
            fetchData();
          }
        }, delay);
      } else {
        console.log("Max retries reached, setting error state");
        stableToast({
          title: "Error fetching data",
          description: "There was a problem loading your business data. Please try again.",
          variant: "destructive"
        });
        
        // Try to provide fallback data if possible
        if (!inventoryData.length && !salesData.length && !suppliersData.length) {
          console.log("Attempting to load fallback data");
          setInventoryData([]); // Fallback to empty array
          setSalesData([]);
          setSuppliersData([]);
        }
        
        if (onError) {
          onError();
        }
        
        // Even after error, we need to exit loading state to prevent infinite spinner
        setIsLoading(false);
        setDataFetched(true);
        fetchInProgress.current = false;
      }
    }
  }, [toast, onError, connectionError, mountedRef, isLoading, timeout]);

  // Clean up function
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      fetchInProgress.current = false;
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
    fetchData,
    retryFetch
  };
}
