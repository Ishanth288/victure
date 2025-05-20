
import { supabase } from "@/integrations/supabase/client";
import { MedicineReturn, ReturnHistoryItem } from "@/types/returns";
import { safeQueryData } from "./safeSupabaseQueries";

export async function processMedicineReturn(
  returnData: Omit<MedicineReturn, 'id' | 'return_date' | 'processed_by' | 'user_id'>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create return record using generic approach to avoid type errors
  const { data, error } = await (supabase as any)
    .from('medicine_returns')
    .insert({
      ...returnData,
      processed_by: user.id,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryAfterReturn(
  inventoryItemId: number,
  quantity: number,
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
      
    const newQuantity = (inventoryItem.quantity || 0) + quantity;
    
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
  let timeCondition: string;
  
  switch (timeframe) {
    case 'week':
      timeCondition = "return_date >= now() - interval '7 days'";
      break;
    case 'month':
      timeCondition = "return_date >= now() - interval '30 days'";
      break;
    case 'year':
      timeCondition = "return_date >= now() - interval '365 days'";
      break;
    default:
      timeCondition = "return_date >= now() - interval '30 days'";
  }

  try {
    // Use the return_analytics view to get return data
    const { data, error } = await supabase
      .from('return_analytics')
      .select(`
        id,
        medicine_name,
        returned_quantity,
        status,
        return_value,
        return_date,
        reason,
        bill_id
      `)
      .eq('user_id', userId)
      .filter('return_date', 'gte', `now() - interval '${timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '365 days'}'`)
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
    // Direct query to the return_analytics view filtered by bill_id
    const { data, error } = await supabase
      .from('return_analytics')
      .select(`
        id,
        bill_id,
        bill_item_id,
        medicine_name,
        returned_quantity,
        original_quantity,
        unit_price,
        return_value,
        return_date,
        status,
        reason
      `)
      .in('bill_id', billIds)
      .order('return_date', { ascending: false });

    if (error) throw error;
    console.log("Fetched return history by bills:", data?.length || 0, "records");
    return (data || []) as ReturnHistoryItem[];
  } catch (error) {
    console.error("Error in getReturnHistoryByBill:", error);
    throw error;
  }
}

export function calculateReturnMetrics(returnData: any[]) {
  if (!returnData || returnData.length === 0) {
    return {
      totalReturns: 0,
      totalValue: 0,
      returnToInventory: 0,
      disposed: 0,
      returnToInventoryValue: 0,
      disposedValue: 0
    };
  }

  const metrics = returnData.reduce((acc, item) => {
    acc.totalReturns += item.returned_quantity || 0;
    acc.totalValue += item.return_value || 0;
    
    if (item.status === 'inventory') {
      acc.returnToInventory += item.returned_quantity || 0;
      acc.returnToInventoryValue += item.return_value || 0;
    } else if (item.status === 'disposed') {
      acc.disposed += item.returned_quantity || 0;
      acc.disposedValue += item.return_value || 0;
    }
    
    return acc;
  }, {
    totalReturns: 0,
    totalValue: 0,
    returnToInventory: 0,
    disposed: 0,
    returnToInventoryValue: 0,
    disposedValue: 0
  });
  
  return metrics;
}
