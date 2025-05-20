
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

export function useProductData(userId: string | null, dateRange: { from: Date, to: Date }) {
  const [topProducts, setTopProducts] = useState<Array<{name: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProductData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Format dates for query
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      
      // Fetch bill items with inventory data
      const { data: billItems, error } = await supabase
        .from('bill_items')
        .select(`
          id,
          inventory_item_id,
          quantity,
          unit_price,
          total_price,
          bill_id,
          bills!inner(date, user_id),
          inventory!inner(name)
        `)
        .eq('bills.user_id', userId)
        .gte('bills.date', fromDate)
        .lte('bills.date', toDate);
        
      if (error) throw error;
      
      // Process top products by revenue
      const productMap = new Map();
      
      billItems?.forEach((item) => {
        if (item.inventory && item.inventory.name) {
          const productName = item.inventory.name || `Product ${item.inventory_item_id}`;
          const revenue = parseFloat(item.total_price) || 0;
          
          if (productMap.has(productName)) {
            const product = productMap.get(productName);
            product.revenue += revenue;
            product.quantity += parseInt(item.quantity) || 0;
          } else {
            productMap.set(productName, {
              name: productName,
              revenue,
              quantity: parseInt(item.quantity) || 0,
            });
          }
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
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching product data:', error);
      displayErrorMessage(error, 'Product Data');
      setIsLoading(false);
    }
  }, [userId, dateRange]);
  
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);
  
  return {
    topProducts,
    isLoading,
    refreshProductData: fetchProductData
  };
}
