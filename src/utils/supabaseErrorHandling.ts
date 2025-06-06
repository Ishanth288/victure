
import { supabase } from '@/integrations/supabase/client';

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: any;
}

/**
 * Enhanced error handling for Supabase queries with better error prevention
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => any,
  context: string = 'query'
): Promise<SupabaseQueryResult<T>> {
  try {
    console.log(`Executing Supabase query: ${context}`);
    
    // Execute the query function with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), 15000)
    );
    
    const result = await Promise.race([queryFn(), timeoutPromise]);
    
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.warn(`Supabase error in ${context}:`, result.error.message);
      return { data: null, error: result.error };
    }
    
    console.log(`Supabase query successful for ${context}`);
    return { data: result?.data || result, error: null };
    
  } catch (error: any) {
    console.warn(`Exception in ${context}:`, error.message);
    return { data: null, error };
  }
}

/**
 * Check Supabase connection without triggering error cascades
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    
    // Use a very lightweight query with short timeout
    const { error } = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
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
