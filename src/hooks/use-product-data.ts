
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

export function useProductData(userId: string | null, dateRange: { from: Date, to: Date }) {
  const [topProducts, setTopProducts] = useState<Array<{name: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductData = useCallback(async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Validate inputs
        if (!dateRange.from || !dateRange.to) {
          throw new Error('Invalid date range provided');
        }
        
        // Create proper date range with time boundaries
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        
        const fromDateTime = startDate.toISOString();
        const toDateTime = endDate.toISOString();
      
      // Step 1: Get bills for the date range
        const { data: bills, error: billsError } = await supabase
          .from('bills')
          .select('id, total_amount, date')
          .eq('user_id', userId)
          .gte('date', fromDateTime)
          .lte('date', toDateTime);
        
      if (billsError) throw billsError;
      
      if (!bills || bills.length === 0) {
        setTopProducts([]);
        setIsLoading(false);
        return;
      }
      
      const billIds = bills.map(bill => bill.id);
      
      // Step 2: Get bill items for these bills
      const { data: billItems, error: billItemsError } = await supabase
        .from('bill_items')
        .select('inventory_item_id, quantity, total_price')
        .in('bill_id', billIds);
        
      if (billItemsError) throw billItemsError;
      
      if (!billItems || billItems.length === 0) {
        setTopProducts([]);
        setIsLoading(false);
        return;
      }
      
      // Step 3: Get inventory names
      const inventoryIds = [...new Set(billItems.map(item => item.inventory_item_id))];
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, name')
        .in('id', inventoryIds);
        
      if (inventoryError) throw inventoryError;
      
      // Create inventory lookup map
      const inventoryMap = new Map<number, string>();
      if (inventory) {
        inventory.forEach(item => {
          inventoryMap.set(item.id, item.name || `Product ${item.id}`);
        });
      }
      
      // Process top products by revenue
      const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
      
      billItems.forEach((item) => {
        const productName = inventoryMap.get(item.inventory_item_id) || `Product ${item.inventory_item_id}`;
        const revenue = parseFloat(String(item.total_price)) || 0;
        
        if (productMap.has(productName)) {
          const product = productMap.get(productName)!;
          product.revenue += revenue;
          product.quantity += parseInt(String(item.quantity)) || 0;
        } else {
          productMap.set(productName, {
            name: productName,
            revenue,
            quantity: parseInt(String(item.quantity)) || 0,
          });
        }
      });
      
      // Convert to array and sort by revenue
      const productsArray = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          value: product.revenue,
        }));
      
      setTopProducts(productsArray);
      
    } catch (err) {
      const newError = err instanceof Error ? err : new Error('An unknown error occurred');
      console.error('Error fetching product data:', newError);
      displayErrorMessage(newError, 'Error in Product Data');
      setError(newError);
      setTopProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRange.from, dateRange.to]);
  
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);
  
  return {
    topProducts,
    isLoading,
    error,
    refreshProductData: fetchProductData
  };
}
