
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { displayErrorMessage } from '@/utils/errorHandling';

interface Customer {
  phone: string;
  visits: number;
  totalSpent: number;
  bills?: Array<any>;
}

export function useCustomerRetention(userId: string | null, dateRange: { from: Date, to: Date }) {
  const [repeatCustomers, setRepeatCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchCustomerData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Format dates for query
      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];
      
      // Fetch bills with patient data
      const { data: bills, error } = await supabase
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
        
      if (error) throw error;
      
      // Process bills to extract customer data
      const customerMap = new Map<string, Customer>();
      
      bills?.forEach((bill: any) => {
        if (bill?.prescription?.patient?.phone_number) {
          const phone = bill.prescription.patient.phone_number;
          const amount = parseFloat(bill.total_amount) || 0;
          
          if (customerMap.has(phone)) {
            const customer = customerMap.get(phone)!;
            customer.visits += 1;
            customer.totalSpent += amount;
            customer.bills!.push(bill);
          } else {
            customerMap.set(phone, {
              phone,
              visits: 1,
              totalSpent: amount,
              bills: [bill]
            });
          }
        }
      });
      
      // Convert to array and filter for repeat customers (more than 1 visit)
      const repeats = Array.from(customerMap.values())
        .filter(customer => customer.visits > 1)
        .sort((a, b) => b.visits - a.visits);
        
      setRepeatCustomers(repeats);
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching customer retention data:', error);
      displayErrorMessage(error, 'Customer Data');
      setIsLoading(false);
    }
  }, [userId, dateRange, toast]);
  
  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);
  
  // Fix the type issue by explicitly typing the customerMap parameter
  const retentionRate = (customerMap: Map<string, Customer>) => {
    if (!customerMap || customerMap.size === 0) return 0;
    
    const totalCustomers = customerMap.size;
    const repeatingCustomers = Array.from(customerMap.values()).filter(
      customer => customer.visits > 1
    ).length;
    
    return Math.round((repeatingCustomers / totalCustomers) * 100);
  };
  
  return {
    repeatCustomers,
    isLoading,
    refreshCustomerData: fetchCustomerData
  };
}
