
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
  const [error, setError] = useState<Error | null>(null);

  const fetchSalesStats = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      if (!dateRange.from || !dateRange.to) {
        throw new Error('Invalid date range provided');
      }
      
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      
      if (isNaN(Date.parse(fromDate)) || isNaN(Date.parse(toDate))) {
        throw new Error('Invalid date format');
      }
      
      const daysDiff = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFromDate = format(new Date(dateRange.from.getTime() - daysDiff * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      const prevToDate = format(new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");
      
      const { data: currentBills, error: currentError } = await supabase
        .from('bills')
        .select('*, prescription:prescriptions(patient:patients(name, phone_number))')
        .eq('user_id', userId)
        .gte('date', fromDate)
        .lte('date', toDate)
        .abortSignal(AbortSignal.timeout(8000));
        
      if (currentError) throw currentError;
      
      const { data: prevBills, error: prevError } = await supabase
        .from('bills')
        .select('*, prescription:prescriptions(patient:patients(name, phone_number))')
        .eq('user_id', userId)
        .gte('date', prevFromDate)
        .lte('date', prevToDate)
        .abortSignal(AbortSignal.timeout(8000));
        
      if (prevError) throw prevError;
      
      const currentSalesCount = currentBills?.length || 0;
      const prevSalesCount = prevBills?.length || 0;
      setTotalSales(currentSalesCount);
      
      const salesChangePercent = prevSalesCount > 0 
        ? ((currentSalesCount - prevSalesCount) / prevSalesCount) * 100 
        : 0;
      setSalesChange(Math.round(salesChangePercent));
      
      const currentRevenue = currentBills?.reduce((sum, bill) => sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      const prevRevenue = prevBills?.reduce((sum, bill) => sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      
      const currentAOV = currentSalesCount > 0 ? currentRevenue / currentSalesCount : 0;
      const prevAOV = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0;
      setAverageOrderValue(currentAOV);
      
      const aovChangePercent = prevAOV > 0 
        ? ((currentAOV - prevAOV) / prevAOV) * 100 
        : 0;
      setAovChange(Math.round(aovChangePercent));
      
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
      
      const repeatCustomerCount = Array.from(customerMap.values()).filter(c => c.visits > 1).length;
      const totalUniqueCustomers = customerMap.size;
      
      const retentionRateValue = totalUniqueCustomers > 0 
        ? (repeatCustomerCount / totalUniqueCustomers) * 100 
        : 0;
      
      setCustomerRetentionRate(Math.round(retentionRateValue));
      setRetentionChange(5);
      
    } catch (err) {
      let newError: Error;
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        newError = new Error('Connection timeout. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        newError = err;
      } else if (typeof err === 'object' && err && 'message' in err) {
        newError = new Error(String(err.message));
      } else {
        newError = new Error('An unknown error occurred while fetching sales stats.');
      }
      
      console.error('Error fetching sales stats:', newError);
      displayErrorMessage(newError, 'Error in Sales Stats');
      setError(newError);

    } finally {
      setIsLoading(false);
    }
  }, [userId, dateRange.from, dateRange.to]);
  
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
    error,
    refreshSalesStats: fetchSalesStats
  };
}
