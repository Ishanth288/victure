
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { displayErrorMessage } from '@/utils/errorHandling';

export function useRevenueData(userId: string | null, dateRange: { from: Date, to: Date }) {
  const [revenueData, setRevenueData] = useState<Array<{date: string, value: number}>>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchRevenueData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Create proper date range with time boundaries
      const startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange.to);
      endDate.setHours(23, 59, 59, 999);
      
      const fromDateTime = startDate.toISOString();
      const toDateTime = endDate.toISOString();
      
      // Previous period for comparison
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(dateRange.from.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      prevStartDate.setHours(0, 0, 0, 0);
      const prevEndDate = new Date(dateRange.from.getTime() - 24 * 60 * 60 * 1000);
      prevEndDate.setHours(23, 59, 59, 999);
      
      const prevFromDateTime = prevStartDate.toISOString();
      const prevToDateTime = prevEndDate.toISOString();
      
      // Fetch current period bills
      const { data: currentBills, error: currentError } = await supabase
        .from('bills')
        .select('total_amount, date')
        .eq('user_id', userId)
        .gte('date', fromDateTime)
        .lte('date', toDateTime);
        
      if (currentError) throw currentError;
      
      // Fetch previous period bills for comparison
      const { data: prevBills, error: prevError } = await supabase
        .from('bills')
        .select('total_amount, date')
        .eq('user_id', userId)
        .gte('date', prevFromDateTime)
        .lte('date', prevToDateTime);
        
      if (prevError) throw prevError;
      
      // Calculate current revenue
      const currentRevenue = currentBills?.reduce((sum, bill) => 
        sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      
      // Calculate previous revenue
      const prevRevenue = prevBills?.reduce((sum, bill) => 
        sum + (parseFloat(String(bill.total_amount)) || 0), 0) || 0;
      
      setTotalRevenue(currentRevenue);
      
      // Calculate revenue change percentage
      const revChange = prevRevenue > 0 
        ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 
        : 0;
      setRevenueChange(Math.round(revChange));
      
      // Generate revenue data for chart
      const revenueByDay = new Map();
      const days = daysDiff + 1; // Include both start and end dates
      
      // Initialize all days with zero revenue
      for (let i = 0; i < days; i++) {
        const date = addDays(dateRange.from, i);
        const dateStr = date.toISOString().split('T')[0];
        revenueByDay.set(dateStr, 0);
      }
      
      // Fill in actual revenue data
      currentBills?.forEach((bill) => {
        if (bill.date) {
          const dateStr = bill.date.substring(0, 10); // Get YYYY-MM-DD part
          if (revenueByDay.has(dateStr)) {
            revenueByDay.set(dateStr, revenueByDay.get(dateStr) + (parseFloat(String(bill.total_amount)) || 0));
          }
        }
      });
      
      // Convert to array for chart
      const chartData = Array.from(revenueByDay.entries())
        .map(([date, value]) => ({
          date,
          value,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setRevenueData(chartData);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      displayErrorMessage(error, 'Revenue Data');
      setIsLoading(false);
    }
  }, [userId, dateRange]);
  
  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);
  
  return {
    revenueData,
    totalRevenue,
    revenueChange,
    isLoading,
    refreshRevenueData: fetchRevenueData
  };
}
