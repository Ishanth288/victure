
import { supabase } from "@/integrations/supabase/client";
import { checkSupabaseConnection } from "./supabaseErrorHandling";

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
}

/**
 * Enable realtime functionality for the tables that need it
 */
async function enableRealtimeForTables() {
  try {
    // You can listen to all changes in the public schema
    await supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        console.log('Database change:', payload);
      })
      .subscribe();
    
    console.log('Realtime subscriptions enabled for database tables');
  } catch (error) {
    console.error('Failed to enable realtime for tables:', error);
  }
}
