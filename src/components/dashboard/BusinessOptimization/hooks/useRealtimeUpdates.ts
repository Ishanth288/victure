
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseRealtimeUpdatesOptions {
  fetchData: () => void;
  refreshLocationData: () => void;
  dataFetched: boolean;
  mountedRef: React.MutableRefObject<boolean>;
}

export function useRealtimeUpdates({
  fetchData,
  refreshLocationData,
  dataFetched,
  mountedRef
}: UseRealtimeUpdatesOptions) {
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up realtime subscriptions");
    
    const setupSubscriptions = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
if (!user || !dataFetched) return () => {};
        
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
      if (cleanup) cleanup.then(unsub => unsub && unsub());
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchData, refreshLocationData, dataFetched, toast, mountedRef]);
}
