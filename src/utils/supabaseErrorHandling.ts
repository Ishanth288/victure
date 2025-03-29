
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
    const { error } = await (supabase as any).from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection check failed:', error);
      Sentry.captureMessage('Supabase connection failed', {
        level: 'error',
        extra: { error }
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    Sentry.captureException(error);
    return false;
  }
}
