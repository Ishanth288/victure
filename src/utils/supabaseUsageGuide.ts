
/**
 * Supabase Usage Guide
 * 
 * This file provides examples of how to correctly use Supabase with TypeScript
 * to avoid common errors and provide type safety.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  safelyInsertData,
  safelyUpdateData,
  safelyGetProperty,
  safelyCastArray,
  safelySpreadObject,
  safeInsert,
  safeSpreading
} from "./supabaseHelpers";
import {
  fetchById,
  insertData,
  updateData,
  deleteData,
  fetchAll,
  fetchByColumn,
  insertManyData
} from "./typeSafeSupabase";

/**
 * Example 1: Fetching a record by ID
 */
export async function fetchProfileExample(userId: string) {
  // Bad approach (will cause TypeScript errors):
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', userId)
  //   .single();
  
  // Good approach (type-safe):
  const profile = await fetchById('profiles', userId);
  
  // Access properties safely
  const pharmacyName = safelyGetProperty(profile, 'pharmacy_name', 'Default Pharmacy');
  return { profile, pharmacyName };
}

/**
 * Example 2: Inserting data
 */
export async function createBillExample(userId: string, prescriptionId: number) {
  // Use the type-safe insert method
  const bill = await insertData('bills', {
    prescription_id: prescriptionId,
    bill_number: `BILL-${Date.now()}`,
    status: 'draft',
    user_id: userId,
    subtotal: 0,
    gst_percentage: 18,
    gst_amount: 0,
    discount_amount: 0,
    total_amount: 0
  });
  
  return bill;
}

/**
 * Example 3: Updating inventory quantity
 */
export async function updateInventoryQuantityExample(itemId: number, newQuantity: number) {
  // Use the type-safe update method
  const updatedItem = await updateData('inventory', itemId, {
    quantity: newQuantity,
  });
  
  return updatedItem;
}

/**
 * Example 4: Fetching data with multiple filters
 */
export async function fetchInventoryWithFiltersExample(userId: string, status: string) {
  // Use a traditional query with proper type handling
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .eq('status', status);
    
  // Safely convert the result
  return safelyCastArray(data);
}

/**
 * Example 5: Safely handle properties from potentially error results
 */
export async function safeAccessPropertiesExample(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  // Even if data has an error, these won't throw
  const pharmacyName = safelyGetProperty(data, 'pharmacy_name', 'Default Pharmacy');
  const planType = safelyGetProperty(data, 'plan_type', 'Free Trial');
  
  return { pharmacyName, planType };
}

/**
 * Example 6: Inserting multiple items
 */
export async function insertMultipleItemsExample(items: any[]) {
  // Use the type-safe batch insert method
  const billItems = items.map(item => ({
    bill_id: item.billId,
    inventory_item_id: item.id,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice
  }));
  
  return await insertManyData('bill_items', billItems);
}

/**
 * Example 7: Safe spreading of objects
 */
export function safeSpreaderExample(data: any) {
  // Default object to use if data is null, undefined, or has error
  const defaultProfile = {
    pharmacy_name: 'Default Pharmacy',
    owner_name: 'Default Owner',
    plan_type: 'Free Trial'
  };
  
  // Safely spread the data with a fallback
  return safelySpreadObject(data, defaultProfile);
}

/**
 * Example 8: For completely custom needs
 */
export async function customQueryExample() {
  // When you need complete control, wrap with try/catch and use proper handling
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        bill_items(*)
      `)
      .eq('status', 'in stock');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error in custom query:', error);
    return [];
  }
}
