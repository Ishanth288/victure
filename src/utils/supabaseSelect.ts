
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
