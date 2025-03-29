
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

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
    Sentry.captureException(error);
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
