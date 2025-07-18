
import { supabase } from "@/integrations/supabase/client";
import { MedicineReturn, ReturnHistoryItem, DatabaseMedicineReturn } from "@/types/returns";
import { safeQueryData } from "./safeSupabaseQueries";

export async function processMedicineReturn(
  returnData: Omit<DatabaseMedicineReturn, 'id'>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create return record
  const { data, error } = await supabase
    .from('medicine_returns')
    .insert({
      bill_item_id: returnData.bill_item_id,
      quantity: returnData.quantity,
      reason: returnData.reason,
      return_date: returnData.return_date,
      status: returnData.status,
      processed_by: returnData.processed_by || user.id,
      user_id: returnData.user_id || user.id,
      refund_amount: 0 // Adding required refund_amount field
    })
    .select()
    .single();

  if (error) throw error;

  // Update bill_items table with return_quantity
  const { data: currentBillItem, error: fetchError } = await supabase
    .from('bill_items')
    .select('return_quantity')
    .eq('id', returnData.bill_item_id)
    .single();

  if (fetchError) throw fetchError;

  const currentReturnQuantity = currentBillItem.return_quantity || 0;
  const newReturnQuantity = currentReturnQuantity + returnData.quantity;

  const { error: updateError } = await supabase
    .from('bill_items')
    .update({ return_quantity: newReturnQuantity })
    .eq('id', returnData.bill_item_id);

  if (updateError) throw updateError;

  if (isDatabaseMedicineReturn(data)) {
    return data;
  } else {
    throw new Error('Returned data does not match DatabaseMedicineReturn type');
  }
}

function isDatabaseMedicineReturn(obj: any): obj is DatabaseMedicineReturn {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.bill_item_id === 'number' &&
    typeof obj.quantity === 'number' &&
    (typeof obj.reason === 'string' || obj.reason === null) &&
    typeof obj.return_date === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.processed_by === 'string' &&
    typeof obj.user_id === 'string'
  );
}

export async function updateInventoryAfterReturn(
  inventoryItemId: number,
  quantityReturned: number,
  returnToInventory: boolean
) {
  if (!returnToInventory) return;

  try {
    // Fetch current inventory quantity
    const { data: inventoryItem, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', inventoryItemId)
      .single();
      
    if (fetchError) throw fetchError;
      
    const newQuantity = (inventoryItem.quantity || 0) + quantityReturned;
    
    // Update the inventory quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', inventoryItemId);
      
    if (updateError) throw updateError;
    
    console.log(`Updated inventory ${inventoryItemId} with new quantity ${newQuantity}`);
    
  } catch (error) {
    console.error("Error updating inventory after return:", error);
    throw error;
  }
}

export async function getReturnAnalytics(userId: string, timeframe: 'week' | 'month' | 'year' = 'month') {
  let intervalDays: number;
  
  switch (timeframe) {
    case 'week':
      intervalDays = 7;
      break;
    case 'month':
      intervalDays = 30;
      break;
    case 'year':
      intervalDays = 365;
      break;
    default:
      intervalDays = 30;
  }

  try {
    // Use the return_analytics view to get return data
    const { data, error } = await supabase
      .from('return_analytics')
      .select(`
        id,
        medicine_name,
        returned_quantity,
        return_value,
        return_date,
        reason,
        bill_id
      `)
      .eq('user_id', userId)
      .gte('return_date', new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000).toISOString())
      .order('return_date', { ascending: false });

    if (error) throw error;
    console.log("Fetched return analytics data:", data?.length || 0, "records");
    return data || [];
  } catch (error) {
    console.error("Error in getReturnAnalytics:", error);
    throw error;
  }
}

export async function getReturnHistoryByBill(billIds: number[]) {
  try {
    // Update the query to include inventory_item_id field from the return_analytics view
    const { data, error } = await supabase
      .from('return_analytics')
      .select(`
        id,
        bill_id,
        bill_item_id,
        inventory_item_id,
        medicine_name,
        returned_quantity,
        original_quantity,
        unit_price,
        return_value,
        return_date,
        reason
      `)
      .in('bill_id', billIds)
      .order('return_date', { ascending: false });

    if (error) throw error;
    console.log("Fetched return history by bills:", data?.length || 0, "records");
    
    // Map to ReturnHistoryItem format
    const returnHistory = data?.map(item => ({
      id: item.id,
      bill_item_id: item.bill_item_id,
      inventory_item_id: item.inventory_item_id,
      medicine_name: item.medicine_name,
      original_quantity: item.original_quantity,
      returned_quantity: item.returned_quantity,
      unit_price: item.unit_price,
      return_value: item.return_value,
      return_date: item.return_date,
      reason: item.reason,
      // prescription_id is not part of the return_analytics view
    })) as ReturnHistoryItem[];
    
    return returnHistory || [];
  } catch (error) {
    console.error("Error in getReturnHistoryByBill:", error);
    throw error;
  }
}

export function calculateReturnMetrics(returnData: any[]) {
  if (!returnData || returnData.length === 0) {
    return {
      totalReturns: 0,
      totalValue: 0
    };
  }

  const metrics = returnData.reduce((acc, item) => {
    acc.totalReturns += item.quantity || 0;
    acc.totalValue += item.return_value || 0;
    
    return acc;
  }, {
    totalReturns: 0,
    totalValue: 0
  });
  
  return metrics;
}
