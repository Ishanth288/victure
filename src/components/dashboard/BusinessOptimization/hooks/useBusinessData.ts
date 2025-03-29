
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocationBasedAnalytics } from "@/components/dashboard/hooks/useLocationBasedAnalytics";
import { checkSupabaseConnection } from "@/utils/supabaseErrorHandling";

interface UseBusinessDataOptions {
  onError?: () => void;
}

export function useBusinessData(options?: UseBusinessDataOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [suppliersData, setSuppliersData] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();
  const maxRetries = useRef(3);
  const retryCount = useRef(0);
  const { 
    locationData, 
    pharmacyLocation, 
    refreshData: refreshLocationData, 
    isLoading: locationLoading 
  } = useLocationBasedAnalytics();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      // Check connection first
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error("Database connection failed. Please check your network connection.");
      }

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch inventory data
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      // Fetch sales data from bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('*, bill_items(*)')
        .eq('user_id', user.id);

      if (billsError) throw billsError;

      // Fetch supplier data from purchase orders
      const { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_items(*)')
        .eq('user_id', user.id);

      if (poError) throw poError;

      if (inventoryItems) {
        setInventoryData(inventoryItems);
      }

      if (bills) {
        setSalesData(bills);
      }

      if (purchaseOrders) {
        setSuppliersData(purchaseOrders);
      }
      
      // Reset retry counter on success
      retryCount.current = 0;
      
      toast({
        title: "Data refreshed",
        description: "Business optimization data has been updated.",
        duration: 3000
      });
    } catch (error: any) {
      console.error("Error fetching business data:", error);
      setConnectionError(error.message || "Unknown error");
      
      // Implement exponential backoff retry
      if (retryCount.current < maxRetries.current) {
        retryCount.current++;
        const delay = 1000 * Math.pow(2, retryCount.current - 1);
        console.log(`Retrying data fetch (${retryCount.current}/${maxRetries.current}) after ${delay}ms`);
        
        setTimeout(() => {
          fetchData();
        }, delay);
      } else {
        toast({
          title: "Error fetching data",
          description: "There was a problem loading your business data.",
          variant: "destructive"
        });
        
        // Call onError callback if provided
        if (options?.onError) {
          options.onError();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast, options]);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const setupSubscriptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Create a channel for inventory updates with improved error handling
        const inventoryChannel = supabase
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
              console.log('Successfully subscribed to realtime updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to realtime updates');
              // Don't trigger full error state for subscription errors
              // just log them and the page will still work with manual refresh
            }
          });
          
        return () => {
          supabase.removeChannel(inventoryChannel);
        };
      } catch (error) {
        console.error("Error setting up realtime subscriptions:", error);
        return () => {};
      }
    };
    
    const cleanup = setupSubscriptions();
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
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
    connectionError
  };
}
