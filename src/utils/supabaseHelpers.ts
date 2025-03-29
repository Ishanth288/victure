
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
        hint: ""
      }
    };
  }
}

/**
 * Error boundary component that catches errors and logs them
 */
export function logError(error: any, info?: string): void {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
}
