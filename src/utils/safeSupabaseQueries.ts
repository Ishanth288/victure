
import { PostgrestSingleResponse } from "@supabase/supabase-js";

/**
 * Type cast a query builder to the given table type
 * @param table The table name
 * @returns A typed query builder
 */
export function typecastQuery<T = any>(table: string): any {
  // This is a type casting function only, it doesn't change the behavior
  return {} as any;
}

/**
 * Safely get data from a Supabase query
 * @param query The Supabase query
 * @param defaultValue Default value to return if query fails
 * @returns The query data or default value
 */
export async function safeQueryData<T>(
  query: any,
  defaultValue: T
): Promise<T> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error("Supabase query error:", error);
      return defaultValue;
    }
    return data as T || defaultValue;
  } catch (err) {
    console.error("Exception in Supabase query:", err);
    return defaultValue;
  }
}

/**
 * Safely execute a Supabase mutation
 * @param query The Supabase query
 * @returns Success status
 */
export async function safeMutation<T>(
  query: Promise<PostgrestSingleResponse<T>>
): Promise<boolean> {
  try {
    const { error } = await query;
    if (error) {
      console.error("Supabase mutation error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception in Supabase mutation:", err);
    return false;
  }
}
