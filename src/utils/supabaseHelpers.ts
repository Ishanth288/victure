
/**
 * Utility functions for working with Supabase
 */
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TableNames = keyof Database['public']['Tables'];

/**
 * Helper function to safely get data from a Supabase query result
 * This prevents TypeScript errors when dealing with Supabase query results that could be error objects
 */
export function safelyGetData<T>(queryResult: T | { error: true } | any): T | null {
  if (!queryResult) return null;
  if (typeof queryResult === 'object' && 'error' in queryResult) return null;
  return queryResult as T;
}

/**
 * Safely executes a Supabase query ensuring proper error handling and type safety
 */
export async function safeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.error("Supabase query error:", error);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Supabase query exception:", error);
    return null;
  }
}

/**
 * Helper to get the current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

/**
 * Safely converts a potentially string ID to any to resolve typing issues
 * with Supabase PostgrestFilterBuilder
 */
export function safeId(id: string | number): any {
  return id;
}

/**
 * Generic type safe function to handle query filtering
 * This resolves TypeScript issues with filter values in eq(), gt(), lt(), etc.
 */
export function safeFilter<T>(value: T): any {
  return value as any;
}

/**
 * Type-safe wrapper for inserting data into Supabase
 */
export async function safeInsert<T extends Record<string, any>>(
  table: TableNames, 
  data: T | T[]
): Promise<{ data: any; error: any }> {
  try {
    const result = await supabase
      .from(table)
      .insert(data as any);
    
    // If we need to return the inserted data
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    // Return the inserted data by performing a select
    const selectResult = await supabase
      .from(table)
      .select('*');
    
    return { 
      data: selectResult.data, 
      error: selectResult.error 
    };
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Type-safe wrapper for updating data in Supabase
 */
export async function safeUpdate<T extends Record<string, any>>(
  table: TableNames,
  data: T,
  match: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    // Create a basic update query
    let updateQuery = supabase.from(table).update(data as any);
    
    // Instead of chaining .eq() calls, we'll build a filter object and apply it
    // This avoids the deep type instantiations that cause TS errors
    const matchKeys = Object.keys(match);
    
    // Apply conditions one by one directly from the object
    if (matchKeys.length > 0) {
      // Apply first condition
      updateQuery = updateQuery.eq(matchKeys[0] as any, match[matchKeys[0]]);
      
      // Loop through remaining conditions
      for (let i = 1; i < matchKeys.length; i++) {
        const key = matchKeys[i];
        updateQuery = updateQuery.eq(key as any, match[key]);
      }
    }
    
    // Execute the update
    const updateResult = await updateQuery;
    
    if (updateResult.error) {
      return { data: null, error: updateResult.error };
    }
    
    // Get the updated data using the same approach
    let selectQuery = supabase.from(table).select('*');
    
    if (matchKeys.length > 0) {
      // Apply first condition
      selectQuery = selectQuery.eq(matchKeys[0] as any, match[matchKeys[0]]);
      
      // Loop through remaining conditions
      for (let i = 1; i < matchKeys.length; i++) {
        const key = matchKeys[i];
        selectQuery = selectQuery.eq(key as any, match[key]);
      }
    }
    
    const selectResult = await selectQuery;
    
    return { 
      data: selectResult.data, 
      error: selectResult.error 
    };
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Type-safe wrapper for selecting data from Supabase
 */
export async function safeSelect<T = any>(
  table: TableNames,
  match: Record<string, any> = {},
  options: { 
    columns?: string; 
    single?: boolean;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}
): Promise<{ data: T | null; error: any }> {
  try {
    let query = supabase
      .from(table)
      .select(options.columns || '*');
    
    // Apply match conditions using the same approach as in safeUpdate
    const matchKeys = Object.keys(match);
    
    if (matchKeys.length > 0) {
      // Apply first condition
      query = query.eq(matchKeys[0] as any, match[matchKeys[0]]);
      
      // Loop through remaining conditions
      for (let i = 1; i < matchKeys.length; i++) {
        const key = matchKeys[i];
        query = query.eq(key as any, match[key]);
      }
    }
    
    // Apply ordering if specified
    if (options.order) {
      query = query.order(options.order.column as any, { 
        ascending: options.order.ascending !== false 
      });
    }
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Execute the query
    if (options.single) {
      const result = await query.maybeSingle();
      return { 
        data: result.data as T, 
        error: result.error 
      };
    } else {
      const result = await query;
      return { 
        data: result.data as T, 
        error: result.error 
      };
    }
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
}
