
import { supabase } from "@/integrations/supabase/client";
import { MedicineReturn } from "@/types/returns";

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
  let timePeriod: string;
  
  switch (timeframe) {
    case 'week':
      timePeriod = 'now() - interval \'7 days\'';
      break;
    case 'month':
      timePeriod = 'now() - interval \'30 days\'';
      break;
    case 'year':
      timePeriod = 'now() - interval \'365 days\'';
      break;
    default:
      timePeriod = 'now() - interval \'30 days\'';
  }

  const { data, error } = await supabase
    .from('return_analytics')
    .select(`
      id,
      medicine_name,
      returned_quantity,
      status,
      return_value,
      return_date
    `)
    .eq('user_id', userId)
    .gte('return_date', timePeriod)
    .order('return_date', { ascending: false });

  if (error) throw error;
  return data || [];
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
