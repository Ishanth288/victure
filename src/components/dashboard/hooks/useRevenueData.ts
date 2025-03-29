
import { useState, useEffect } from 'react';
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { typecastQuery, safeQueryData } from "@/utils/safeSupabaseQueries";

interface Bill {
  id: number;
  bill_number: string;
  date: string;
  total_amount: number;
  prescription_id?: number;
  status: string;
}

export function useRevenueData() {
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState<Bill[]>([]);
  const [revenueData, setRevenueData] = useState<{date: string, value: number}[]>([]);
  const [topProducts, setTopProducts] = useState<{name: string, value: number}[]>([]);
  const [revenueDistribution, setRevenueDistribution] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    fetchRevenueData();
    
    // Set up real-time subscriptions for bills
    const setupRevenueSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('revenue-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'bills', filter: `user_id=eq.${user.id}` }, 
          () => fetchRevenueData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRevenueSubscriptions();
    
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  async function fetchRevenueData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user-specific bills
      const bills = await safeQueryData(
        typecastQuery('bills')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        []
      );
      
      setSalesData(bills as Bill[]);
      
      if (bills && bills.length > 0) {
        processRevenueData(bills);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function processRevenueData(bills: any[]) {
    // Process revenue by date
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        value: 0
      };
    }).reverse();
    
    const billsByDate = new Map<string, number>();
    
    bills.forEach((bill: any) => {
      const billDate = bill.date ? format(new Date(bill.date), 'yyyy-MM-dd') : null;
      if (billDate) {
        const existingAmount = billsByDate.get(billDate) || 0;
        billsByDate.set(billDate, existingAmount + bill.total_amount);
      }
    });
    
    const revenueByDate = last30Days.map(day => {
      return {
        ...day,
        value: billsByDate.get(day.date) || 0
      };
    });
    
    setRevenueData(revenueByDate);
    
    // Process top products
    if (bills.length > 0) {
      const productCountMap = new Map<string, number>();
      
      bills.forEach((bill: any) => {
        if (bill.prescription_id) {
          const productName = `Prescription #${bill.prescription_id}`;
          const existingValue = productCountMap.get(productName) || 0;
          productCountMap.set(productName, existingValue + bill.total_amount);
        }
      });
      
      const productArray = Array.from(productCountMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      
      const topProductsData = productArray
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setTopProducts(topProductsData);
    }
    
    // Process revenue distribution
    if (bills.length > 0) {
      const categoryMap = new Map<string, number>();
      categoryMap.set('Prescription', 0);
      categoryMap.set('OTC Medicines', 0);
      categoryMap.set('Medical Supplies', 0);
      categoryMap.set('Other', 0);
      
      bills.forEach((bill: any) => {
        if (bill.prescription_id) {
          const existingValue = categoryMap.get('Prescription') || 0;
          categoryMap.set('Prescription', existingValue + bill.total_amount);
        } else {
          const rand = Math.random();
          if (rand < 0.3) {
            const existingValue = categoryMap.get('OTC Medicines') || 0;
            categoryMap.set('OTC Medicines', existingValue + bill.total_amount);
          } else if (rand < 0.6) {
            const existingValue = categoryMap.get('Medical Supplies') || 0;
            categoryMap.set('Medical Supplies', existingValue + bill.total_amount);
          } else {
            const existingValue = categoryMap.get('Other') || 0;
            categoryMap.set('Other', existingValue + bill.total_amount);
          }
        }
      });
      
      const distributionData = Array.from(categoryMap.entries())
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value
        }));
      
      setRevenueDistribution(distributionData);
    }
  }

  // Calculate total revenue
  const totalRevenue = salesData.reduce((sum, bill) => sum + (bill.total_amount || 0), 0);

  return {
    isLoading,
    totalRevenue,
    revenueData,
    topProducts,
    revenueDistribution,
    salesData
  };
}
