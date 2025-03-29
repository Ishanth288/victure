
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Error boundary component that catches errors and logs them
 */
export function logError(error: any, info?: string): void {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
  Sentry.captureException(error);
}

/**
 * Check Supabase connection and attempt to reconnect if necessary
 * This can help recover from connection issues during preview loads
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // Try a simple, lightweight query to test connection
    const { error } = await (supabase as any).from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      Sentry.captureMessage('Supabase connection failed', {
        level: 'error',
        extra: { error }
      });
      
      // Try to recover connection
      await recoverConnection();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    Sentry.captureException(error);
    
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
    // Force a refresh of the auth session which can help re-establish connection
    await supabase.auth.refreshSession();
    console.log('Attempted connection recovery via session refresh');
    
    // Intentionally adding a small delay to allow for recovery
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Recovery attempt failed:', error);
  }
}
