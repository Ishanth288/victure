
import { supabase } from "@/integrations/supabase/client";
import { MedicineReturn, ReturnHistoryItem } from "@/types/returns";
import { safeQueryData } from "./safeSupabaseQueries";

export async function processMedicineReturn(
  returnData: Omit<MedicineReturn, 'id' | 'return_date' | 'processed_by' | 'user_id'>
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create return record
  const { data, error } = await supabase
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

  // Update inventory quantity
  const { error } = await supabase
    .from('inventory')
    .update({
      quantity: supabase.rpc('increment', {
        row_id: inventoryItemId,
        amount: quantity
      })
    })
    .eq('id', inventoryItemId);

  if (error) throw error;
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

  const { data, error } = await supabase
    .from('return_analytics')
    .select(`
      id,
      medicine_name,
      returned_quantity,
      status,
      return_value,
      return_date,
      reason
    `)
    .eq('user_id', userId)
    .filter('return_date', 'gte', `now() - interval '${timeframe === 'week' ? '7 days' : timeframe === 'month' ? '30 days' : '365 days'}'`)
    .order('return_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReturnHistoryByPrescription(prescriptionId: number) {
  const { data, error } = await supabase
    .from('return_analytics')
    .select(`
      id,
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
    .eq('prescription_id', prescriptionId)
    .order('return_date', { ascending: false });

  if (error) throw error;
  return data as ReturnHistoryItem[] || [];
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
