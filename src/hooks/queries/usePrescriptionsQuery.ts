import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PrescriptionWithPatient {
  id: number;
  prescription_number: string;
  doctor_name: string;
  date: string;
  status: string;
  patient_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  patients: {
    id: number;
    name: string;
    phone_number: string;
  };
  has_bill: boolean;
  bill_id?: number;
  bill_number?: string;
  bill_total_amount?: number;
  bill_date?: string;
  bills: {
    id: number;
    bill_number: string;
    total_amount: number;
    date: string;
    status: string;
    payment_method: string;
  }[];
}

const fetchPrescriptions = async (userId: string): Promise<PrescriptionWithPatient[]> => {
  if (!userId) {
    console.error('fetchPrescriptions called without userId');
    return [];
  }

  console.log(`Fetching prescriptions for user: ${userId}`);

  const { data, error } = await supabase.rpc('get_prescription_details', { p_user_id: userId });

  if (error) {
    console.error('Error fetching prescription details:', error);
    throw new Error(error.message);
  }

  console.log(`Successfully fetched ${data?.length || 0} prescriptions.`);
  return data || [];
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