import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { typecastQuery, safeQueryData } from "@/utils/safeSupabaseQueries";

interface Prescription {
  id: number;
  prescription_number: string;
  doctor_name: string;
  patient_id: number;
  date: string;
  status: string;
  user_id: string;
}

export function usePrescriptionData() {
  const [isLoading, setIsLoading] = useState(true);
  const [prescriptionsData, setPrescriptionsData] = useState<Prescription[]>([]);

  useEffect(() => {
    let prescriptionChannel: any;
    let mounted = true;

    const fetchPrescriptionData = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user found during prescription data fetch');
          setIsLoading(false);
          return;
        }

        // Fetch user-specific prescriptions
        const prescriptions = await safeQueryData(
          typecastQuery('prescriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
          []
        );
        
        console.log('Fetched prescriptions:', prescriptions);

        if (mounted) {
          setPrescriptionsData(prescriptions as Prescription[]);
        }
      } catch (error) {
        console.error('Error fetching prescription data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;

        // Check if the channel already exists or is active to prevent multiple subscriptions
        const existingChannels = supabase.getChannels();
        const channelExists = existingChannels.some(channel => channel.topic === 'realtime:prescription-updates');

        if (!channelExists) {
          prescriptionChannel = supabase
            .channel('prescription-updates')
            .on('postgres_changes',
              { event: '*', schema: 'public', table: 'prescriptions', filter: `user_id=eq.${user.id}` },
              () => {
                if (mounted) {
                  fetchPrescriptionData();
                }
              }
            )
            .subscribe();
        }
      } catch (error) {
        console.error('Error setting up prescription subscription:', error);
      }
    };

    fetchPrescriptionData();
    setupSubscription();

    // Cleanup function
    return () => {
      mounted = false;
      if (prescriptionChannel) {
        supabase.removeChannel(prescriptionChannel);
      }
    };
  }, []);

  // Function to manually refresh data
  const refresh = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const prescriptions = await safeQueryData(
        typecastQuery('prescriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        []
      );
      
      setPrescriptionsData(prescriptions as Prescription[]);
    } catch (error) {
      console.error('Error refreshing prescription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate prescription metrics - TODAY specifically
  const today = new Date().toISOString().split('T')[0];
  const totalPrescriptionsToday = prescriptionsData.filter(prescription => {
    if (!prescription.date) return false;
    const prescriptionDate = new Date(prescription.date).toISOString().split('T')[0];
    return prescriptionDate === today;
  }).length;

  const totalPrescriptions = prescriptionsData.length;

  console.log('Prescription metrics:', {
    today,
    totalPrescriptionsToday,
    totalPrescriptions,
    prescriptionsCount: prescriptionsData.length
  });

  return {
    isLoading,
    prescriptionsData,
    totalPrescriptionsToday,
    totalPrescriptions,
    refresh
  };
}
