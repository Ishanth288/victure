
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

/**
 * Enhanced error handling for Supabase queries
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => any,
  context: string = 'query'
): Promise<SupabaseQueryResult<T>> {
  try {
    console.log(`Executing Supabase query: ${context}`);
    
    // Execute the query function and await the result
    const result = await queryFn();
    
    if (result.error) {
      console.error(`Supabase error in ${context}:`, result.error);
      return { data: null, error: result.error };
    }
    
    console.log(`Supabase query successful for ${context}:`, result.data?.length || 'N/A', 'records');
    return { data: result.data, error: null };
    
  } catch (error: any) {
    console.error(`Exception in ${context}:`, error);
    return { data: null, error };
  }
}

/**
 * Check Supabase connection and attempt to reconnect if necessary
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    // Try a simple, lightweight query to test connection
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      return false;
    }
    
    console.log("Supabase connection test successful");
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

/**
 * Handle Supabase errors with user-friendly messages
 */
export async function handleSupabaseError(error: any, context: string = 'operation') {
  console.error(`Supabase error in ${context}:`, error);
  
  // Return a user-friendly error message
  if (error?.message) {
    return error.message;
  }
  
  return `An error occurred during ${context}. Please try again.`;
}

/**
 * Display error messages using toast
 */
export function displayErrorMessage(error: any, context: string = 'operation') {
  console.error(`Error in ${context}:`, error);
  
  // This would need to be called from a component with access to toast
  // For now, just log the error
  const message = error?.message || `An error occurred during ${context}`;
  console.error(`User-facing error: ${message}`);
}

/**
 * Check if an error is a connection-related error
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch')
  );
}

/**
 * Check if an error is authentication-related
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code || '';
  
  return (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('login') ||
    code === '401' ||
    code === 'PGRST301'
  );
}
