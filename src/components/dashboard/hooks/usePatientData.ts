
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
    let patientChannel: any;
    let mounted = true;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Check if the channel already exists or is active to prevent multiple subscriptions
        const existingChannels = supabase.getChannels();
        const channelExists = existingChannels.some(channel => channel.topic === 'realtime:patient-updates');

        if (!channelExists) {
          patientChannel = supabase
            .channel('patient-updates')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'patients', filter: `user_id=eq.${user.id}` },
              () => {
                if (mounted) {
                  fetchPatientData();
                }
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error setting up patient subscription:', error);
      }
    };

    const fetchPatientData = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user found during patient data fetch');
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
        
        console.log('Fetched patients:', patients);

        if (mounted) {
          setPatientsData(patients as Patient[]);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPatientData();
    setupSubscription();

    // Cleanup function
    return () => {
      mounted = false;
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
        console.warn('No authenticated user found during patient data fetch');
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
      
      console.log('Fetched patients:', patients);

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
