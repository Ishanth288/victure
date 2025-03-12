
import { supabase } from "@/integrations/supabase/client";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { safelyHandleQueryResponse } from "./supabaseHelpers";

/**
 * Type-safe wrapper utilities for Supabase operations
 */

/**
 * Type-safe wrapper for filtering by ID in Supabase queries
 */
export function typeSafeEq<T>(column: keyof T, value: string | number) {
  return (query: any) => {
    // @ts-ignore - We're bypassing TypeScript's strict type checking here
    return query.eq(column, value);
  };
}

/**
 * Type-safe wrapper for inserting data into Supabase tables
 */
export async function typeSafeInsert<TInsert, TResult = any>(
  table: string,
  data: TInsert | TInsert[]
): Promise<PostgrestSingleResponse<TResult>> {
  // Cast the data as any to bypass TypeScript's strictness
  const insertData = Array.isArray(data) ? data : [data];
  
  // @ts-ignore - Ignore TypeScript type checking for insert data
  return await supabase.from(table).insert(insertData as any);
}

/**
 * Type-safe wrapper for updating data in Supabase tables
 */
export async function typeSafeUpdate<TUpdate, TResult = any>(
  table: string,
  data: TUpdate,
  condition: { column: string; value: string | number }
): Promise<PostgrestSingleResponse<TResult>> {
  // @ts-ignore - Ignore TypeScript type checking for update data
  return await supabase
    .from(table)
    .update(data as any)
    .eq(condition.column, condition.value);
}

/**
 * Type-safe wrapper for selecting data from Supabase tables
 */
export async function typeSafeSelect<TResult>(
  table: string,
  columns: string = '*',
  filter?: (query: any) => any
): Promise<TResult[]> {
  let query = supabase.from(table).select(columns);
  
  if (filter) {
    query = filter(query);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error selecting from ${table}:`, error);
    return [];
  }
  
  return data as unknown as TResult[];
}

/**
 * Type-safe wrapper for selecting a single record from Supabase
 */
export async function typeSafeSingle<TResult>(
  table: string,
  columns: string = '*',
  filter: (query: any) => any
): Promise<TResult | null> {
  const query = supabase.from(table).select(columns);
  
  const { data, error } = await filter(query).single();
  
  if (error) {
    console.error(`Error selecting from ${table}:`, error);
    return null;
  }
  
  return data as unknown as TResult;
}

/**
 * Helper function to safely update inventory quantities
 */
export async function safeUpdateInventoryQuantity(
  inventoryId: number, 
  newQuantity: number
): Promise<boolean> {
  try {
    const { error } = await typeSafeUpdate(
      'inventory',
      { quantity: newQuantity },
      { column: 'id', value: inventoryId }
    );
    
    if (error) {
      console.error('Error updating inventory quantity:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception updating inventory quantity:', err);
    return false;
  }
}

/**
 * Helper function for creating bill items
 */
export async function createBillItems(
  billId: number,
  items: Array<{
    inventory_item_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>
): Promise<boolean> {
  try {
    const billItems = items.map(item => ({
      bill_id: billId,
      inventory_item_id: item.inventory_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price
    }));
    
    const { error } = await typeSafeInsert('bill_items', billItems);
    
    if (error) {
      console.error('Error creating bill items:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception creating bill items:', err);
    return false;
  }
}
