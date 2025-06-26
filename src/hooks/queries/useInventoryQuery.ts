import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';

// Fetch inventory function
const fetchInventory = async (userId: string): Promise<InventoryItem[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { data, error: fetchError } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false });

  if (fetchError) {
    throw fetchError;
  }

  // Transform data to ensure proper types
  const transformedData = (data || []).map((item: any) => ({
    ...item,
    id: Number(item.id),
    quantity: Number(item.quantity) || 0,
    unit_cost: Number(item.unit_cost) || 0,
    selling_price: Number(item.selling_price) || 0,
    reorder_point: Number(item.reorder_point) || 10,
  } as InventoryItem));

  return transformedData;
};

export const useInventoryQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => fetchInventory(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
