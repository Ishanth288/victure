
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
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setPharmacyData(data);
        updateTitle(data.pharmacy_name);
      }
    } catch (error: any) {
      console.error("Error fetching pharmacy data:", error);
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
