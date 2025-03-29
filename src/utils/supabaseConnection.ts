
import { supabase } from "@/integrations/supabase/client";

/**
 * Check Supabase connection and attempt to reconnect if necessary
 * This can help recover from connection issues during preview loads
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    // Try a simple, lightweight query to test connection
    const { error } = await (supabase as any).from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      
      // Try to recover connection
      await recoverConnection();
      return false;
    }
    
    console.log("Supabase connection test successful");
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    
    // Try to recover connection
    await recoverConnection();
    return false;
  }
}

/**
 * Attempt to recover a failed Supabase connection
 * This helps especially with preview and initial load issues
 */
async function recoverConnection(): Promise<void> {
  try {
    console.log("Attempting to recover Supabase connection...");
    
    // Force a refresh of the auth session which can help re-establish connection
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error("Session refresh failed during recovery attempt:", error);
      return;
    }
    
    console.log('Attempted connection recovery via session refresh');
    
    // Intentionally adding a small delay to allow for recovery
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}
