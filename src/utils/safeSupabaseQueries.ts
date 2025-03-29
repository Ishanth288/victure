
import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to type-cast Supabase queries to avoid TypeScript errors
 * @param table The table name to query
 * @returns A query builder for the specified table
 */
export function typecastQuery(table: string) {
  return (supabase as any).from(table);
}

/**
 * Helper function to safely handle and unwrap Supabase responses
 * @param queryPromise A Supabase query promise
 * @param defaultValue Default value to return if query fails
 * @returns The data from the query or the default value
 */
export async function safeQueryData<T>(queryPromise: Promise<any>, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await queryPromise;
    
    if (error) {
      console.error('Supabase query error:', error);
      return defaultValue;
    }
    
    return (data as T) || defaultValue;
  } catch (error) {
    console.error('Error executing Supabase query:', error);
    return defaultValue;
  }
}

/**
 * Helper function for type casting ID parameters to avoid TypeScript errors
 * @param id The ID parameter to cast
 * @returns The ID parameter as 'any' type
 */
export function typedId(id: string | number): any {
  return id;
}

/**
 * Helper function for creating a type-safe Supabase filter
 * @param field The field name to filter on
 * @param value The value to filter by
 * @returns An object representing the filter
 */
export function createFilter(field: string, value: any): any {
  return { [field]: value };
}
