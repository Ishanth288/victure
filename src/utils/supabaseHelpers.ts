
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
 * These type-safe helper functions resolve TypeScript's "type instantiation is excessively deep and possibly infinite" error
 * when working with Supabase's PostgreSQL query builder.
 */

/**
 * A type-safe filter function that avoids TypeScript deep instantiation errors
 */
export function eq<T>(column: string, value: T): any {
  return { [column]: value };
}

/**
 * Type-safe wrapper for inserting data into Supabase
 */
export async function safeInsert<InsertData extends Record<string, any>>(
  table: TableNames, 
  data: InsertData | InsertData[]
): Promise<{ data: any; error: any }> {
  try {
    const dataArray = Array.isArray(data) ? data : [data];
    
    // Cast to any to bypass TypeScript's deep type instantiation
    const result = await (supabase
      .from(table) as any)
      .insert(dataArray);
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { 
      data: result.data, 
      error: null 
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
export async function safeUpdate<UpdateData extends Record<string, any>>(
  table: TableNames,
  data: UpdateData,
  match: Record<string, any>
): Promise<{ data: any; error: any }> {
  try {
    // Start with the base query and cast to any to bypass TypeScript's deep type instantiation
    let query = (supabase.from(table) as any).update(data);
    
    // Handle the special case of a single filter condition for ID
    if (Object.keys(match).length === 1 && 'id' in match) {
      query = query.eq('id', match.id);
    } 
    // Handle other filter conditions
    else if (Object.keys(match).length > 0) {
      // Apply all conditions directly without chaining to avoid deep instantiation
      const filters = Object.entries(match).map(([key, value]) => `${key}.eq.${value}`).join(',');
      query = query.or(filters);
    }
    
    const result = await query;
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { 
      data: result.data, 
      error: null 
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
    // Base query with casting to avoid deep instantiation
    let query = (supabase.from(table) as any).select(options.columns || '*');
    
    // Handle the special case of a single filter condition for better performance and simpler code
    if (Object.keys(match).length === 1) {
      const [key, value] = Object.entries(match)[0];
      query = query.eq(key, value);
    } 
    // Handle multiple filter conditions
    else if (Object.keys(match).length > 0) {
      // For multiple conditions, we'll use the match object directly to avoid chaining
      // by constructing a filter string
      const filters = Object.entries(match)
        .map(([key, value]) => `${key}.eq.${value}`)
        .join(',');
      
      if (filters) {
        query = query.or(filters);
      }
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
    
    // Execute query based on whether we want a single result or multiple
    let result;
    if (options.single) {
      result = await query.maybeSingle();
    } else {
      result = await query;
    }
    
    return { 
      data: result.data as T, 
      error: result.error 
    };
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return { data: null, error };
  }
}

/**
 * Type-safe wrapper for deleting data from Supabase
 */
export async function safeDelete(
  table: TableNames,
  match: Record<string, any>
): Promise<{ error: any }> {
  try {
    // Cast to any to bypass TypeScript's deep type instantiation
    let query = (supabase.from(table) as any).delete();
    
    // Handle the special case of a single filter condition for ID
    if (Object.keys(match).length === 1 && 'id' in match) {
      query = query.eq('id', match.id);
    } 
    // Handle other filter conditions
    else if (Object.keys(match).length > 0) {
      // Apply all conditions
      const filters = Object.entries(match).map(([key, value]) => `${key}.eq.${value}`).join(',');
      query = query.or(filters);
    }
    
    const result = await query;
    
    return { error: result.error };
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { error };
  }
}

/**
 * Type-safe wrapper for counting data in Supabase
 */
export async function safeCount(
  table: TableNames,
  match: Record<string, any> = {}
): Promise<{ count: number | null; error: any }> {
  try {
    // Cast to any to bypass TypeScript's deep type instantiation
    let query = (supabase.from(table) as any).select('*', { count: 'exact', head: true });
    
    // Handle the special case of a single filter condition
    if (Object.keys(match).length === 1) {
      const [key, value] = Object.entries(match)[0];
      query = query.eq(key, value);
    } 
    // Handle multiple filter conditions
    else if (Object.keys(match).length > 0) {
      const filters = Object.entries(match)
        .map(([key, value]) => `${key}.eq.${value}`)
        .join(',');
      
      if (filters) {
        query = query.or(filters);
      }
    }
    
    const { count, error } = await query;
    
    return { count, error };
  } catch (error) {
    console.error(`Error counting in ${table}:`, error);
    return { count: null, error };
  }
}
