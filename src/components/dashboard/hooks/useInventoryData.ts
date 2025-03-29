
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { typecastQuery, safeQueryData } from "@/utils/safeSupabaseQueries";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  selling_price?: number;
  reorder_point?: number;
}

export function useInventoryData() {
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetchInventoryData();
    
    // Set up real-time subscriptions for inventory
    const setupInventorySubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('inventory-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory', filter: `user_id=eq.${user.id}` }, 
          () => fetchInventoryData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupInventorySubscriptions();
    
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  async function fetchInventoryData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user-specific inventory
      const inventory = await safeQueryData(
        typecastQuery('inventory')
          .select('*')
          .eq('user_id', user.id),
        []
      );
      
      setInventoryData(inventory as InventoryItem[]);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate inventory metrics
  const totalInventoryValue = inventoryData.reduce(
    (sum, item) => sum + (item.unit_cost * item.quantity || 0), 
    0
  );
  
  const lowStockItems = inventoryData.filter(
    item => (item.quantity || 0) < (item.reorder_point || 10)
  ).length;

  // Calculate profit metrics
  const totalSellingValue = inventoryData.reduce(
    (sum, item) => sum + ((item.selling_price || 0) * item.quantity || 0),
    0
  );

  const totalProfit = totalSellingValue - totalInventoryValue;
  
  // Calculate overall profit margin
  const profitMargin = totalSellingValue > 0 
    ? (totalProfit / totalSellingValue) * 100 
    : 0;

  // Calculate profit by item
  const itemProfits = inventoryData.map(item => ({
    id: item.id,
    name: item.name,
    profit: ((item.selling_price || 0) - item.unit_cost) * item.quantity,
    profitMargin: item.selling_price ? ((item.selling_price - item.unit_cost) / item.selling_price) * 100 : 0
  }));

  return {
    isLoading,
    inventoryData,
    totalInventoryValue,
    lowStockItems,
    profitMetrics: {
      totalProfit,
      profitMargin,
      itemProfits
    }
  };
}
