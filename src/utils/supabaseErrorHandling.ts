import { supabase } from '@/integrations/supabase/client';

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

/**
 * Enhanced error handling for Supabase queries with much faster timeouts
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => any,
  context: string = 'query',
  options: { timeout?: number; retries?: number } = {}
): Promise<SupabaseQueryResult<T>> {
  const { timeout = 3000, retries = 1 } = options; // Reduced timeout to 3s and retries to 1
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Executing Supabase query: ${context} (attempt ${attempt + 1}/${retries + 1})`);
      
      // Execute the query function with short timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Query timeout after ${timeout}ms`)), timeout)
      );
      
      const result = await Promise.race([queryFn(), timeoutPromise]);
      
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        const error = result.error;
        
        // Only retry connection-related errors
        if (isRetryableError(error) && attempt < retries) {
          console.warn(`Retryable error in ${context}, attempt ${attempt + 1}:`, error.message);
          lastError = error;
          
          // Very short wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        console.warn(`Supabase error in ${context}:`, error.message);
        return { data: null, error };
      }
      
      console.log(`Supabase query successful for ${context}`);
      return { data: result?.data || result, error: null };
      
    } catch (error: any) {
      lastError = error;
      
      if (isRetryableError(error) && attempt < retries) {
        console.warn(`Retryable exception in ${context}, attempt ${attempt + 1}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      console.warn(`Exception in ${context}:`, error.message);
      break;
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * Check Supabase connection with very short timeout
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    
    // Very short timeout for connection test
    const { error } = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 1500))
    ]) as any;
    
    if (error) {
      console.warn('Supabase connection check failed:', error.message);
      return false;
    }
    
    console.log("Supabase connection test successful");
    return true;
  } catch (error: any) {
    console.warn('Error checking Supabase connection:', error.message);
    return false;
  }
}

/**
 * Handle Supabase errors with user-friendly messages without causing cascades
 */
export async function handleSupabaseError(error: any, context: string = 'operation'): Promise<string> {
  console.warn(`Supabase error in ${context}:`, error?.message || error);
  
  // Return a user-friendly error message without triggering toasts
  if (error?.message) {
    return error.message;
  }
  
  return `An error occurred during ${context}. Please try again.`;
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
    message.includes('fetch') ||
    message.includes('failed to load')
  );
}

/**
 * Check if an error is retryable (connection/timeout related)
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  return (
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('abort') ||
    code === 'network_error' ||
    code === 'timeout' ||
    code === 'connection_error'
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
