
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

export function useSalesStats(userId: string | null, dateRange: { from: Date, to: Date }) {
  const [totalSales, setTotalSales] = useState(0);
  const [salesChange, setSalesChange] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [aovChange, setAovChange] = useState(0);
  const [customerRetentionRate, setCustomerRetentionRate] = useState(0);
  const [retentionChange, setRetentionChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchSalesStats = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Format dates for query
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      
      // Previous period for comparison
      const daysDiff = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFromDate = format(new Date(dateRange.from.getTime() - daysDiff * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      const prevToDate = format(new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      
      // Fetch current period bills
      const { data: currentBills, error: currentError } = await supabase
        .from('bills')
        .select(`
          *,
          prescription:prescriptions (
            patient:patients (
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', userId)
        .gte('date', fromDate)
        .lte('date', toDate);
        
      if (currentError) throw currentError;
      
      // Fetch previous period bills for comparison
      const { data: prevBills, error: prevError } = await supabase
        .from('bills')
        .select(`
          *,
          prescription:prescriptions (
            patient:patients (
              name,
              phone_number
            )
          )
        `)
        .eq('user_id', userId)
        .gte('date', prevFromDate)
        .lte('date', prevToDate);
        
      if (prevError) throw prevError;
      
      // Calculate total sales (number of bills)
      const currentSalesCount = currentBills?.length || 0;
      const prevSalesCount = prevBills?.length || 0;
      setTotalSales(currentSalesCount);
      
      // Calculate sales change percentage
      const salesChangePercent = prevSalesCount > 0 
        ? ((currentSalesCount - prevSalesCount) / prevSalesCount) * 100 
        : 0;
      setSalesChange(Math.round(salesChangePercent));
      
      // Calculate current revenue
      const currentRevenue = currentBills?.reduce((sum, bill) => 
        sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      
      // Calculate previous revenue
      const prevRevenue = prevBills?.reduce((sum, bill) => 
        sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      
      // Calculate average order value
      const currentAOV = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
      const prevAOV = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0;
      setAverageOrderValue(currentAOV);
      
      // Calculate AOV change percentage
      const aovChangePercent = prevAOV > 0 
        ? ((currentAOV - prevAOV) / prevAOV) * 100 
        : 0;
      setAovChange(Math.round(aovChangePercent));
      
      // Process customer retention data
      const allBills = [...(currentBills || []), ...(prevBills || [])];
      const customerMap = new Map();
      
      allBills.forEach((bill) => {
        if (bill?.prescription?.patient?.phone_number) {
          const phone = bill.prescription.patient.phone_number;
          
          if (customerMap.has(phone)) {
            customerMap.get(phone).visits += 1;
          } else {
            customerMap.set(phone, { visits: 1 });
          }
        }
      });
      
      // Calculate retention rate: repeat customers / total unique customers
      const repeatCustomerCount = Array.from(customerMap.values()).filter(c => c.visits > 1).length;
      const totalUniqueCustomers = customerMap.size;
      
      const retentionRateValue = totalUniqueCustomers > 0 
        ? (repeatCustomerCount / totalUniqueCustomers) * 100 
        : 0;
      
      setCustomerRetentionRate(Math.round(retentionRateValue));
      setRetentionChange(5); // Fixed value for now as per original code
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      displayErrorMessage(error, 'Sales Stats');
      setIsLoading(false);
    }
  }, [userId, dateRange]);
  
  useEffect(() => {
    fetchSalesStats();
  }, [fetchSalesStats]);
  
  return {
    totalSales,
    salesChange,
    averageOrderValue,
    aovChange,
    customerRetentionRate,
    retentionChange,
    isLoading,
    refreshSalesStats: fetchSalesStats
  };
}
