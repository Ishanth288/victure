
// Export all error handling utilities from a single file
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

/**
 * Handle Supabase query errors with proper retry logic
 */
export async function handleSupabaseError(error: any, context: string): Promise<void> {
  console.error(`Supabase error in ${context}:`, error);
  
  if (error?.message?.includes('400') || error?.message?.includes('Bad Request')) {
    console.log('Attempting to recover from 400 error...');
    
    // Try to refresh session for auth errors
    if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        toast({
          title: "Authentication Error",
          description: "Please try logging in again",
          variant: "destructive",
        });
      }
    }
    
    // Check connection
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again",
        variant: "destructive",
      });
    }
  }
}

/**
 * Wrapper for Supabase queries with automatic error handling and retry
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  context: string,
  maxRetries: number = 2
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      if (result.error) {
        lastError = result.error;
        
        if (attempt < maxRetries) {
          console.log(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
          await handleSupabaseError(result.error, context);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        console.log(`Query threw error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`);
        await handleSupabaseError(error, context);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  // All retries failed
  console.error(`All ${maxRetries + 1} attempts failed for ${context}:`, lastError);
  return { data: null, error: lastError };
}
