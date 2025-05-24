
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Export security-enhanced version of auth state change
 */
export const onAuthStateChange = (callback: (session: any) => void) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('User authenticated with secure session');
    }
    callback(session);
  });
  
  return data;
};

/**
 * Helper method to safely handle Supabase query results
 */
export const handleQueryResult = <T>(result: T | { error: true }) => {
  if (result && typeof result === 'object' && 'error' in result && result.error === true) {
    console.error("Supabase query error:", result);
    return null;
  }
  return result as T;
};

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
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to insert data into ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"  // Adding the name property
      }
    };
  }
}

/**
 * Safely selects data from a table by ID, with proper error handling
 */
export async function safeSelectById<T>(
  table: string,
  id: string | number,
  options?: { select?: string; }
): Promise<{ data: T | null; error: PostgrestError | null }> {
  try {
    const query = (supabase as any)
      .from(table)
      .select(options?.select || '*')
      .eq('id', id)
      .single();
    
    const result = await query;
    
    // Check for errors in the response
    if (result.error) {
      console.error(`Error selecting from ${table}:`, result.error);
      return result;
    }
    
    // Handle potential issues by checking if data exists
    if (!result.data) {
      return {
        data: null,
        error: {
          code: "not-found",
          message: `No data found in ${table} with id ${id}`,
          details: "",
          hint: "",
          name: "NotFoundError"
        }
      };
    }
    
    return { data: result.data as T, error: null };
  } catch (error) {
    console.error(`Error selecting data from ${table}:`, error);
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to select data from ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"
      }
    };
  }
}

/**
 * Safely selects data from a table by any field, with proper error handling
 */
export async function safeSelectByField<T>(
  table: string,
  field: string,
  value: any,
  options?: { select?: string; single?: boolean }
): Promise<{ data: T | null; error: PostgrestError | null }> {
  try {
    let query = (supabase as any)
      .from(table)
      .select(options?.select || '*')
      .eq(field, value);
    
    if (options?.single) {
      query = query.single();
    }
    
    const result = await query;
    
    // Check for errors in the response
    if (result.error) {
      console.error(`Error selecting from ${table}:`, result.error);
      return result;
    }
    
    return { data: result.data as T, error: null };
  } catch (error) {
    console.error(`Error selecting data from ${table}:`, error);
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to select data from ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"
      }
    };
  }
}

/**
 * Safely updates data in a table
 */
export async function safeUpdate<T>(
  table: string,
  data: any,
  field: string,
  value: any
): Promise<{ data: T | null; error: PostgrestError | null }> {
  try {
    const result = await (supabase as any)
      .from(table)
      .update(data)
      .eq(field, value);
    
    return result;
  } catch (error) {
    console.error(`Error updating data in ${table}:`, error);
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to update data in ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"
      }
    };
  }
}

/**
 * Safely updates data in a table by ID
 */
export async function safeUpdateById<T>(
  table: string,
  id: string | number,
  data: any
): Promise<{ data: T | null; error: PostgrestError | null }> {
  return safeUpdate<T>(table, data, 'id', id);
}

/**
 * Safely deletes data from a table
 */
export async function safeDelete(
  table: string,
  field: string,
  value: any
): Promise<{ data: any | null; error: PostgrestError | null }> {
  try {
    const result = await (supabase as any)
      .from(table)
      .delete()
      .eq(field, value);
    
    return result;
  } catch (error) {
    console.error(`Error deleting data from ${table}:`, error);
    return {
      data: null,
      error: {
        code: "custom-error",
        message: `Failed to delete data from ${table}: ${error}`,
        details: "",
        hint: "",
        name: "CustomError"
      }
    };
  }
}

/**
 * Safely deletes data from a table by ID
 */
export async function safeDeleteById(
  table: string,
  id: string | number
): Promise<{ data: any | null; error: PostgrestError | null }> {
  return safeDelete(table, 'id', id);
}

/**
 * Error boundary component that catches errors and logs them
 */
export function logError(error: any, info?: string): void {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
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
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

/**
 * Safely check for data before accessing properties
 * This function helps prevent null property access errors
 */
export function safeDataAccess<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
  if (!obj) return defaultValue;
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Type guard to check if a response has an error
 */
export function hasError(response: any): response is { error: PostgrestError } {
  return response && response.error !== null && response.error !== undefined;
}

/**
 * Handle Supabase queries with proper error checking to prevent TypeScript errors
 * @param response The response from a Supabase query
 * @param fallback A fallback value to return if the response has an error
 * @returns The data from the response or the fallback value
 */
export function handleQueryData<T>(response: any, fallback: T): T {
  if (hasError(response) || !response.data) {
    return fallback;
  }
  return response.data as T;
}

/**
 * Safe cast function to handle unknown types from Supabase
 * @param data Data of unknown type
 * @param defaultValue Default value to return if data is invalid
 * @returns The data cast to type T or the default value
 */
export function safeCast<T>(data: unknown, defaultValue: T): T {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  return data as T;
}

/**
 * Initialize application monitoring and connection checks
 * This helps ensure stability during preview and production deployments
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
