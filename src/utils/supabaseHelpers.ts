
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
  data: T | T[],
  options: { returning?: boolean } = { returning: true }
): Promise<{ data: any; error: any }> {
  try {
    return await supabase
      .from(table)
      .insert(data as any)
      .select(options.returning ? '*' : undefined);
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
  match: Record<string, any>,
  options: { returning?: boolean } = { returning: true }
): Promise<{ data: any; error: any }> {
  try {
    let query = supabase.from(table).update(data as any);
    
    // Apply all match conditions
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key as any, value as any);
    });
    
    if (options.returning) {
      return await query.select();
    }
    
    return await query;
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
    
    // Apply all match conditions
    Object.entries(match).forEach(([key, value]) => {
      query = query.eq(key as any, value as any);
    });
    
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
    
    if (options.single) {
      const result = await query.single();
      return result as any;
    }
    
    return await query;
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
}
