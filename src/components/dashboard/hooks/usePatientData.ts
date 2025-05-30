
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
    let patientChannel: any = null; // Declare patientChannel inside useEffect

    const setupAndFetch = async () => {
      await fetchPatientData(); // Initial fetch

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      patientChannel = supabase
        .channel('patient-updates')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'patients', filter: `user_id=eq.${user.id}` },
          () => fetchPatientData() // Fetch on changes
        )
        .subscribe();
    };

    setupAndFetch();

    // Cleanup function
    return () => {
      if (patientChannel) {
        supabase.removeChannel(patientChannel);
      }
    };
  }, []);

  // Function to manually refresh data
  const refresh = () => {
    fetchPatientData();
  };

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
      
      console.log('Fetched patients:', patients); // Log fetched patients

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
    totalPatients,
    refresh
  };
}
