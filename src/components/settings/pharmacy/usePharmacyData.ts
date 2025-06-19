
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PharmacyData } from "./types";

export function usePharmacyData() {
  const [pharmacyData, setPharmacyData] = useState<PharmacyData>({
    pharmacy_name: "",
    owner_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | null; message: string | null }>({
    type: null,
    message: null
  });

  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    console.log('usePharmacyData: fetchPharmacyData started');
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('usePharmacyData: supabase.auth.getSession() response', session);

      if (!session?.user?.id) {
        console.log('usePharmacyData: No session or user ID found. Returning early.');
        setIsLoading(false);
        return;
      }
      console.log('usePharmacyData: Session and user ID found', session.user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      console.log('usePharmacyData: Profile fetch result', { data, error });

      if (error) throw error;
      if (data) {
        console.log('usePharmacyData: Pharmacy data fetched successfully', data);
        setPharmacyData(data);
        updateTitle(data.pharmacy_name);
      }
    } catch (error: any) {
      console.error("usePharmacyData: Error fetching pharmacy data:", error);
      setStatusMessage({
        type: 'error',
        message: error.message
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      console.log('usePharmacyData: fetchPharmacyData finished. Loading:', false);
      setIsLoading(false);
    }
  };

  const updateTitle = (pharmacyName: string) => {
    document.title = `${pharmacyName} - Dashboard`;
    localStorage.setItem('pharmacyName', pharmacyName);
    window.dispatchEvent(new Event('pharmacyNameUpdated'));
  };

  const setSuccessMessage = (message: string) => {
    setStatusMessage({
      type: 'success',
      message
    });
  };

  const resetStatusMessage = () => {
    setStatusMessage({
      type: null,
      message: null
    });
  };

  return {
    pharmacyData,
    setPharmacyData,
    isLoading,
    statusMessage,
    setSuccessMessage,
    resetStatusMessage
  };
}
