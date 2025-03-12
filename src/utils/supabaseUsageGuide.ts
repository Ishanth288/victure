
/**
 * This is a reference guide for using the typed Supabase helpers
 * 
 * Import the helpers you need:
 * import { typeSafeEq, typeSafeInsert, typeSafeUpdate, typeSafeSelect } from '@/utils/typeSafeSupabase';
 * import { safelyGetProperty, filterById, safelyHandleQueryResponse } from '@/utils/supabaseHelpers';
 */

import { supabase } from "@/integrations/supabase/client";
import { typeSafeEq, typeSafeInsert, typeSafeUpdate, typeSafeSelect } from './typeSafeSupabase';
import { safelyGetProperty, filterById, safelyHandleQueryResponse } from './supabaseHelpers';

// Example 1: Filtering by ID (old way vs new way)
export async function exampleFilterById() {
  // Old way (with TypeScript errors)
  // const { data: oldWay } = await supabase
  //   .from('profiles')
  //   .select('*')
  //   .eq('id', 'some-uuid')
  //   .single();
  
  // New way 1 - Using filterById helper with all three required arguments
  const { data: newWay1 } = await supabase
    .from('profiles')
    .select('*')
    .filter(filterById('id', 'some-uuid', 'profiles'))
    .single();
  
  // New way 2 - Using typeSafeEq helper
  const { data: newWay2 } = await supabase
    .from('profiles')
    .select('*')
    .filter(typeSafeEq('id', 'some-uuid'))
    .single();
    
  return newWay1 || newWay2;
}

// Example 2: Inserting data safely
export async function exampleInsertData() {
  // Data to insert
  const bill = {
    prescription_id: 123,
    bill_number: "BILL-123",
    status: "completed",
    user_id: "user-123",
    // Add other required fields
    subtotal: 100,
    gst_amount: 18,
    gst_percentage: 18,
    total_amount: 118,
    discount_amount: 0
  };
  
  // Old way (with TypeScript errors)
  // const { data: oldWay } = await supabase
  //   .from('bills')
  //   .insert([bill])
  //   .select();
  
  // New way - Using typeSafeInsert helper
  const { data, error } = await typeSafeInsert('bills', bill);
  
  if (error) {
    console.error('Error inserting bill:', error);
    return null;
  }
  
  return data;
}

// Example 3: Updating data safely
export async function exampleUpdateData() {
  // Old way (with TypeScript errors)
  // const { data: oldWay } = await supabase
  //   .from('inventory')
  //   .update({ quantity: 50 })
  //   .eq('id', 123);
  
  // New way - Using typeSafeUpdate helper
  const { data, error } = await typeSafeUpdate(
    'inventory',
    { quantity: 50 },
    { column: 'id', value: 123 }
  );
  
  if (error) {
    console.error('Error updating inventory:', error);
    return null;
  }
  
  return data;
}

// Example 4: Selecting data with safe property access
export async function exampleSelectWithSafeAccess() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .filter(filterById('id', 'some-uuid', 'profiles'))
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  // Safely access properties with fallbacks
  const pharmacyName = safelyGetProperty(data, 'pharmacy_name', 'Default Pharmacy');
  const ownerName = safelyGetProperty(data, 'owner_name', 'Default Owner');
  
  return {
    pharmacyName,
    ownerName
  };
}

// Example 5: Using typeSafeSelect for cleaner async/await usage
export async function exampleTypeSafeSelect() {
  // This handles errors internally and returns empty array if there's a problem
  const profiles = await typeSafeSelect(
    'profiles',
    '*',
    query => query.eq('owner_name', 'John Doe')
  );
  
  return profiles;
}
