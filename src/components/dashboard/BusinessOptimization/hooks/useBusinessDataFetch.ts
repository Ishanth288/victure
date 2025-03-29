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
  maxRetries = 2, // Reduced from 3 to 2
  timeout = 6000  // Reduced from 15000 to 6000ms
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
  
  useEffect(() => {
    maxRetriesRef.current = maxRetries;
  }, [maxRetries]);

  const retryFetch = useCallback(() => {
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, not retrying");
      return;
    }
    
    console.log("Manual retry fetch triggered");
    setConnectionError(null);
    setErrorType('unknown');
    retryCount.current = 0;
    fetchInProgress.current = false;
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
    
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    
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
          maxRetries: 1,
          retryDelay: 300
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

      const inventoryPromise = async () => {
        console.log("Fetching inventory data...");
        const result = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
          .limit(30);
        console.log("Inventory query result:", result);
        return result;
      };

      const inventoryResult = await executeWithRetry(
        inventoryPromise,
        { 
          context: "inventory",
          maxRetries: 1,
          retryDelay: 300
        }
      );

      if (inventoryResult.error) {
        console.error("Inventory query error:", inventoryResult.error);
        throw inventoryResult.error;
      }

      console.log("Fetching bills data...");
      const billsPromise = async () => {
        const result = await supabase
          .from('bills')
          .select('*, bill_items(*)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(20);
        console.log("Bills query result:", result);
        return result;
      };

      const billsResult = await executeWithRetry(
        billsPromise,
        { 
          context: "bills",
          maxRetries: 1,
          retryDelay: 300
        }
      );

      if (billsResult.error) {
        console.error("Bills query error:", billsResult.error);
        setSalesData([]);
      } else if (billsResult.data) {
        setSalesData(billsResult.data as any[]);
      }

      console.log("Fetching purchase orders data...");
      const purchaseOrdersPromise = async () => {
        const result = await supabase
          .from('purchase_orders')
          .select('*, purchase_order_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        console.log("Purchase orders query result:", result);
        return result;
      };

      const purchaseOrdersResult = await executeWithRetry(
        purchaseOrdersPromise,
        { 
          context: "purchase_orders",
          maxRetries: 1,
          retryDelay: 300
        }
      );

      if (purchaseOrdersResult.error) {
        console.error("Purchase orders query error:", purchaseOrdersResult.error);
        setSuppliersData([]);
      } else if (purchaseOrdersResult.data) {
        setSuppliersData(purchaseOrdersResult.data as any[]);
      }

      if (!mountedRef.current) {
        console.log("Component unmounted, stopping state updates");
        fetchInProgress.current = false;
        return;
      }
      
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      
      console.log("Setting inventory data:", inventoryResult.data?.length || 0, "items");
      if (inventoryResult.data) {
        setInventoryData(inventoryResult.data as any[]);
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
        const delay = 300 * Math.pow(1.3, retryCount.current - 1);
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
        
        if (!inventoryData.length && !salesData.length && !suppliersData.length) {
          setInventoryData([]);
          setSalesData([]);
          setSuppliersData([]);
        }
        
        if (onError) {
          onError();
        }
        
        setIsLoading(false);
        setDataFetched(true);
        fetchInProgress.current = false;
      }
    }
  }, [toast, onError, connectionError, mountedRef, isLoading, timeout]);

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
