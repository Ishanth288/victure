import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrescriptionWithPatient {
  id: number;
  prescription_number: string;
  doctor_name: string | null;
  date: string;
  status: string;
  patient_id: number;
  user_id: string;
  migration_id: string;
  polytherapy: boolean;
  prescription_type: string;
  has_return?: boolean;
  return_amount?: number;
  patients: {
    id: number;
    name: string;
    phone_number: string;
  };
  bills: {
    id: number;
    bill_number: string;
    total_amount: number;
    date: string;
    status: string;
    payment_method: string;
    bill_items?: {
      id: number;
      return_quantity?: number;
      unit_price: number;
    }[];
  }[];
}

const fetchPrescriptions = async (userId: string): Promise<PrescriptionWithPatient[]> => {
  if (!userId) {
    console.error('fetchPrescriptions called without userId');
    return [];
  }

  console.log(`Fetching prescriptions for user: ${userId}`);

  const { data, error } = await supabase.from('prescriptions')
    .select(`
      *,
      patients (
        id,
        name,
        phone_number
      ),
      bills!inner (
        id,
        bill_number,
        total_amount,
        date,
        status,
        payment_method,
        bill_items (
          id,
          return_quantity,
          unit_price
        )
      )
    `)
    .eq('user_id', userId)
    .gt('bills.total_amount', 0)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prescription details:', error);
    throw new Error(error.message);
  }

  // Calculate return information for each prescription
  const prescriptionsWithReturns = (data || []).map(prescription => {
    let totalReturnAmount = 0;
    let hasReturn = false;

    prescription.bills.forEach(bill => {
      bill.bill_items?.forEach(item => {
        if (item.return_quantity && item.return_quantity > 0) {
          hasReturn = true;
          totalReturnAmount += item.return_quantity * item.unit_price;
        }
      });
    });

    return {
      ...prescription,
      has_return: hasReturn,
      return_amount: totalReturnAmount
    };
  });

  console.log(`Successfully fetched ${prescriptionsWithReturns.length} prescriptions.`);
  return prescriptionsWithReturns as unknown as PrescriptionWithPatient[];
};

export const usePrescriptionsQuery = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['prescriptions', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      const result = await fetchPrescriptions(userId);
      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false
   });
};