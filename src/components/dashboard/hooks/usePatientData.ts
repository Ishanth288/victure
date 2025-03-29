
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { typecastQuery, safeQueryData } from "@/utils/safeSupabaseQueries";

interface Patient {
  id: number;
  name: string;
}

export function usePatientData() {
  const [isLoading, setIsLoading] = useState(true);
  const [patientsData, setPatientsData] = useState<Patient[]>([]);

  useEffect(() => {
    fetchPatientData();
    
    // Set up real-time subscriptions for patients
    const setupPatientSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('patient-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'patients', filter: `user_id=eq.${user.id}` }, 
          () => fetchPatientData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupPatientSubscriptions();
    
    return () => {
      if (cleanup) cleanup.then(unsub => unsub && unsub());
    };
  }, []);

  async function fetchPatientData() {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user-specific patients
      const patients = await safeQueryData(
        typecastQuery('patients')
          .select('*')
          .eq('user_id', user.id),
        []
      );
      
      setPatientsData(patients as Patient[]);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate patient metrics
  const totalPatients = patientsData.length;

  return {
    isLoading,
    patientsData,
    totalPatients
  };
}
