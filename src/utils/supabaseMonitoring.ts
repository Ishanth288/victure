
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "./supabaseErrorHandling";
import { toast } from "@/hooks/use-toast";

/**
 * Initialize application monitoring and connection checks
 * This helps ensure stability during preview and deployment
 */
export function initializeAppMonitoring(): void {
  // Enable realtime functionality for needed tables
  enableRealtimeForTables();
  
  // Check connection on app start
  checkSupabaseConnection()
    .then(connected => {
      if (connected) {
        console.log('Supabase connection established successfully');
      } else {
        console.warn('Failed to establish Supabase connection on startup');
        toast({
          title: "Connection warning",
          description: "Connection to database was temporarily lost, trying to reconnect",
          variant: "default"
        });
      }
    });

  // Set up periodic connection checks (every 30 seconds)
  // This can help recover from connection issues that might occur
  setInterval(() => {
    checkSupabaseConnection()
      .then(connected => {
        if (!connected) {
          console.warn('Periodic connection check failed, attempting recovery...');
        }
      });
  }, 30000);
  
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
}

/**
 * Handle browser coming online
 */
function handleOnline() {
  console.log('Browser is online, checking Supabase connection...');
  checkSupabaseConnection().then(connected => {
    if (connected) {
      toast({
        title: "Connection restored",
        description: "Your internet connection has been restored",
        duration: 3000
      });
    }
  });
}

/**
 * Handle browser going offline
 */
function handleOffline() {
  console.warn('Browser is offline, Supabase connections will fail');
  toast({
    title: "Connection lost",
    description: "Please check your internet connection",
    variant: "destructive",
    duration: 5000
  });
}

/**
 * Enable realtime functionality for the tables that need it
 */
async function enableRealtimeForTables() {
  try {
    // You can listen to all changes in the public schema
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        console.log('Database change:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscriptions enabled for database tables');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to enable realtime subscriptions');
          toast({
            title: "Realtime error",
            description: "Failed to subscribe to realtime updates",
            variant: "destructive"
          });
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Failed to enable realtime for tables:', error);
  }
}

/**
 * Check if the application can connect to Supabase
 * Returns a promise that resolves to a boolean indicating connection status
 */
export async function checkSupabaseAvailability(): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Error checking Supabase availability:', error);
    return false;
  }
}
