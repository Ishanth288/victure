
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
 * Completely rewritten to avoid TypeScript deep instantiation errors
 */
export async function safeUpdate<T extends Record<string, any>>(
  table: TableNames,
  data: T,
  match: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    // Start with the base query
    const updateQuery = supabase.from(table).update(data as any);
    
    // Handle the matching conditions
    const matchKeys = Object.keys(match);
    let result;
    
    // Use type 'any' and different patterns to avoid deep type instantiation
    if (matchKeys.length === 0) {
      // No conditions
      result = await updateQuery;
    } else {
      // Convert to 'any' type to avoid TypeScript analyzing the chain too deeply
      let query: any = updateQuery;
      
      // Apply all conditions
      for (const key of matchKeys) {
        query = query.eq(key, match[key]);
      }
      
      result = await query;
    }
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    // Get the updated data with the same technique
    const selectQuery = supabase.from(table).select('*');
    let selectResult;
    
    if (matchKeys.length === 0) {
      selectResult = await selectQuery;
    } else {
      let query: any = selectQuery;
      
      for (const key of matchKeys) {
        query = query.eq(key, match[key]);
      }
      
      selectResult = await query;
    }
    
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
 * Rewritten to avoid TypeScript deep instantiation errors
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
    // Base query
    const baseQuery = supabase
      .from(table)
      .select(options.columns || '*');
    
    // Turn into 'any' type to avoid deep instantiation issues
    let query: any = baseQuery;
    
    // Apply all conditions
    const matchKeys = Object.keys(match);
    for (const key of matchKeys) {
      query = query.eq(key, match[key]);
    }
    
    // Apply ordering if specified
    if (options.order) {
      query = query.order(options.order.column, { 
        ascending: options.order.ascending !== false 
      });
    }
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    // Execute query
    if (options.single) {
      const result = await query.maybeSingle();
      return { data: result.data as T, error: result.error };
    } else {
      const result = await query;
      return { data: result.data as T, error: result.error };
    }
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
}
