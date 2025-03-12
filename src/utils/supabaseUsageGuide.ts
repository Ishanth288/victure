
/**
 * This file provides examples of how to use the type-safe Supabase utilities
 */

import { supabase } from "@/integrations/supabase/client";
import { 
  fetchById, 
  fetchAll, 
  insertData, 
  updateData, 
  deleteData,
  fetchByColumn
} from "./typeSafeSupabase";
import { filterById } from "./supabaseHelpers";
import { safeQueryExecution } from "./supabaseHelpers";

/**
 * Example: Fetching a profile by ID
 */
export async function getProfileExample(userId: string) {
  // Using the type-safe wrapper
  const profile = await fetchById('profiles', userId);
  return profile;
}

/**
 * Example: Fetching all inventory items
 */
export async function getAllInventoryExample() {
  // Using the type-safe wrapper
  const items = await fetchAll('inventory');
  return items;
}

/**
 * Example: Creating a new patient
 */
export async function createPatientExample(name: string, phone: string, userId: string) {
  // Data to insert
  const patientData = {
    name,
    phone_number: phone,
    user_id: userId
  };
  
  // Using the type-safe wrapper
  const newPatient = await insertData('patients', patientData);
  return newPatient;
}

/**
 * Example: Updating an inventory item
 */
export async function updateInventoryExample(itemId: number, newQuantity: number) {
  // Data to update
  const updateData = {
    quantity: newQuantity
  };
  
  // Using the type-safe wrapper to update
  const updatedItem = await updateData('inventory', itemId, updateData);
  return updatedItem;
}

/**
 * Example: Using the simpler filterById utility
 */
export async function findItemWithSimpleFilter(itemId: number) {
  const { data, error } = await filterById('inventory', itemId);
  
  if (error) {
    console.error("Error fetching item:", error);
    return null;
  }
  
  return data;
}

/**
 * Example: Using safeQueryExecution for custom queries
 */
export async function getSalesBySupplierId(supplierId: string) {
  return safeQueryExecution(
    () => supabase
      .from('inventory')
      .select('*')
      .eq('supplier', supplierId),
    []
  );
}

/**
 * Example: Using fetchByColumn
 */
export async function getItemsByStatus(status: string) {
  return fetchByColumn('inventory', 'status', status);
}
