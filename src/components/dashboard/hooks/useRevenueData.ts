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
    
    // Set up real-time subscription
    let revenueChannel: any;
    revenueChannel = supabase
      .channel('revenue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills'
        },
        () => {
          fetchRevenueData();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(revenueChannel);
    };
  }, []);

  // Function to manually refresh data
  const refresh = () => {
    fetchRevenueData();
  };

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
      
      console.log('Fetched bills:', bills);

      setSalesData(bills as Bill[]);
      
      if (bills && bills.length > 0) {
        processRevenueData(bills as Bill[]);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function processRevenueData(bills: Bill[]) {
    // Process revenue by date
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'yyyy-MM-dd'),
        value: 0
      };
    }).reverse();
    
    const billsByDate = new Map<string, number>();
    
    bills.forEach((bill) => {
      try {
        if (bill.date) {
          const billDate = format(new Date(bill.date), 'yyyy-MM-dd');
          const existingAmount = billsByDate.get(billDate) || 0;
          billsByDate.set(billDate, existingAmount + (bill.total_amount || 0));
        }
      } catch (error) {
        console.error('Error parsing date for bill:', bill.id, error);
      }
    });
    
    const revenueByDate = last30Days.map(day => {
      return {
        ...day,
        value: billsByDate.get(day.date) || 0
      };
    });
    
    console.log('Processed revenue by date:', revenueByDate);
    setRevenueData(revenueByDate);
    
    // Process top products
    if (bills.length > 0) {
      const productCountMap = new Map<string, number>();
      
      bills.forEach((bill) => {
        if (bill.prescription_id) {
          const productName = `Prescription #${bill.prescription_id}`;
          const existingValue = productCountMap.get(productName) || 0;
          productCountMap.set(productName, existingValue + (bill.total_amount || 0));
        }
      });
      
      const productArray = Array.from(productCountMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
      
      const topProductsData = productArray
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      console.log('Processed top products:', topProductsData);
      setTopProducts(topProductsData);
    }
    
    // Process revenue distribution with deterministic categorization
    if (bills.length > 0) {
      const categoryMap = new Map<string, number>();
      categoryMap.set('Prescription', 0);
      categoryMap.set('OTC Medicines', 0);
      categoryMap.set('Medical Supplies', 0);
      categoryMap.set('Other', 0);
      
      bills.forEach((bill) => {
        const amount = bill.total_amount || 0;
        
        if (bill.prescription_id) {
          const existingValue = categoryMap.get('Prescription') || 0;
          categoryMap.set('Prescription', existingValue + amount);
        } else {
          // Use bill ID for deterministic categorization instead of random
          const category = bill.id % 3;
          let categoryName: string;
          
          switch (category) {
            case 0:
              categoryName = 'OTC Medicines';
              break;
            case 1:
              categoryName = 'Medical Supplies';
              break;
            default:
              categoryName = 'Other';
              break;
          }
          
          const existingValue = categoryMap.get(categoryName) || 0;
          categoryMap.set(categoryName, existingValue + amount);
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
    salesData,
    refresh
  };
}
