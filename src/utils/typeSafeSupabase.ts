
/**
 * Type-safe wrappers for Supabase operations
 */
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { isQueryError } from "./supabaseHelpers";

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];
type InsertType<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type UpdateType<T extends TableName> = Database['public']['Tables'][T]['Update'];

/**
 * Safely fetch a single record by ID
 */
export async function fetchById<T extends TableName>(
  table: T,
  id: number | string,
  idColumnName: string = 'id'
): Promise<Partial<TableRow<T>> | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(idColumnName, id as any)
      .single();

    if (error) {
      console.error(`Error fetching ${table} by ${idColumnName}:`, error);
      return null;
    }

    return data as Partial<TableRow<T>>;
  } catch (error) {
    console.error(`Error in fetchById for ${table}:`, error);
    return null;
  }
}

/**
 * Safely insert data
 */
export async function insertData<T extends TableName>(
  table: T,
  data: InsertType<T>
): Promise<Partial<TableRow<T>> | null> {
  try {
    // Use as any to bypass strict type checking for insert operation
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert([data as any])
      .select()
      .single();

    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return null;
    }

    return insertedData as Partial<TableRow<T>>;
  } catch (error) {
    console.error(`Error in insertData for ${table}:`, error);
    return null;
  }
}

/**
 * Safely insert multiple records
 */
export async function insertManyData<T extends TableName>(
  table: T,
  data: InsertType<T>[]
): Promise<Partial<TableRow<T>>[] | null> {
  try {
    // Use as any to bypass strict type checking for insert operation
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert(data as any[])
      .select();

    if (error) {
      console.error(`Error inserting multiple records into ${table}:`, error);
      return null;
    }

    return insertedData as Partial<TableRow<T>>[];
  } catch (error) {
    console.error(`Error in insertManyData for ${table}:`, error);
    return null;
  }
}

/**
 * Safely update data
 */
export async function updateData<T extends TableName>(
  table: T,
  id: number | string,
  data: UpdateType<T>,
  idColumnName: string = 'id'
): Promise<Partial<TableRow<T>> | null> {
  try {
    // Use as any to bypass strict type checking for update operation
    const { data: updatedData, error } = await supabase
      .from(table)
      .update(data as any)
      .eq(idColumnName, id as any)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }

    return updatedData as Partial<TableRow<T>>;
  } catch (error) {
    console.error(`Error in updateData for ${table}:`, error);
    return null;
  }
}

/**
 * Safely delete data
 */
export async function deleteData<T extends TableName>(
  table: T,
  id: number | string,
  idColumnName: string = 'id'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumnName, id as any);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in deleteData for ${table}:`, error);
    return false;
  }
}

/**
 * Safely fetch all records from a table
 */
export async function fetchAll<T extends TableName>(
  table: T,
  select: string = '*'
): Promise<Partial<TableRow<T>>[] | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select);

    if (error) {
      console.error(`Error fetching all from ${table}:`, error);
      return null;
    }

    return data as Partial<TableRow<T>>[];
  } catch (error) {
    console.error(`Error in fetchAll for ${table}:`, error);
    return null;
  }
}

/**
 * Safely fetch records by a specific column value
 */
export async function fetchByColumn<T extends TableName>(
  table: T,
  columnName: string,
  value: string | number | boolean,
  select: string = '*'
): Promise<Partial<TableRow<T>>[] | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq(columnName, value as any);

    if (error) {
      console.error(`Error fetching from ${table} by ${columnName}:`, error);
      return null;
    }

    return data as Partial<TableRow<T>>[];
  } catch (error) {
    console.error(`Error in fetchByColumn for ${table}:`, error);
    return null;
  }
}

/**
 * Extract data safely from a Supabase response
 */
export function extractData<T>(response: PostgrestSingleResponse<any>): T | null {
  if (response.error || !response.data) {
    return null;
  }
  
  return response.data as T;
}

/**
 * Handle errors in Supabase responses
 */
export function handleError(error: any): null {
  console.error("Supabase operation failed:", error);
  return null;
}

/**
 * Safe cast of data to a specific type
 */
export function safelyCast<T>(data: any): T | null {
  if (!data || isQueryError(data)) {
    return null;
  }
  
  return data as T;
}

/**
 * Simplified wrapper for filtering by column
 */
export function filterByColumn<T extends TableName>(
  table: T, 
  columnName: string, 
  value: any
) {
  return supabase
    .from(table)
    .select('*')
    .eq(columnName, value as any);
}
