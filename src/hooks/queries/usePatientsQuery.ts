import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatientWithPrescriptions {
  id: number;
  name: string;
  phone_number: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  prescriptions?: {
    id: number;
    prescription_number: string;
    doctor_name: string;
    date: string;
    status: string;
    bills?: {
      id: number;
      total_amount: number;
      bill_number: string;
      date: string;
    }[];
  }[];
}

const fetchPatients = async (userId: string): Promise<PatientWithPrescriptions[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { data, error } = await supabase.from('patients')
    .select(`
      id,
      name,
      phone_number,
      address,
      date_of_birth,
      gender,
      user_id,
      created_at,
      updated_at,
      prescriptions (
        id,
        prescription_number,
        doctor_name,
        date,
        status,
        bills (
          id,
          total_amount,
          bill_number,
          date
        )
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching patient details:', error);
    throw error;
  }

  return data || [];
};

export const usePatientsQuery = (userId: string | null) => {
  return useQuery({
    queryKey: ['patients', userId],
    queryFn: () => fetchPatients(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};