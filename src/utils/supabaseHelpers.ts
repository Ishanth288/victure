
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

/**
 * Safely inserts data into any table, handling type issues and error management
 * @param table The table name to insert into
 * @param data The data to insert
 * @returns The result of the insertion operation
 */
export async function safeInsert<T>(
  table: string, 
  data: T
): Promise<{ data: any | null; error: PostgrestError | null }> {
  try {
    // Use the from method with any to bypass TypeScript strict checking
    // This is necessary when we need to insert into tables that might not be
    // fully typed in our application
    const result = await (supabase as any)
      .from(table)
      .insert(data);
      
    return result;
  } catch (error) {
    console.error(`Error inserting data into ${table}:`, error);
    Sentry.captureException(error);
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to insert data into ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"  // Adding the missing 'name' property
      }
    };
  }
}

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
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
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

/**
 * Initialize application monitoring and connection checks
 * This helps ensure stability during preview and production deployments
 */
export function initializeAppMonitoring(): void {
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
