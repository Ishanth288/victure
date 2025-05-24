
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import * as Sentry from "@sentry/react";

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
    Sentry.captureException(error);
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
