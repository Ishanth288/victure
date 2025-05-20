
// Export all error handling utilities from a single file
import { supabase } from '@/integrations/supabase/client';
export * from './errorHandling';
export * from './supabaseConnection';
export * from './queryRetry';

/**
 * Check Supabase connection and attempt to reconnect if necessary
 * This can help recover from connection issues during preview loads
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    
    // Try with a timeout to prevent hanging connections
    const connectionPromise = supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    // Add a timeout for the connection check
    const timeoutPromise = new Promise<{error: {message: string}}>((resolve) => {
      setTimeout(() => {
        resolve({error: {message: 'Connection timeout'}});
      }, 5000); // 5 second timeout
    });
    
    // Race between the connection attempt and the timeout
    const { error } = await Promise.race([connectionPromise, timeoutPromise]);
    
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
    
    // Try a simple query to check if connection is restored
    const { error: testError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('Connection still failed after recovery attempt:', testError);
    } else {
      console.log('Connection successfully recovered');
    }
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}
