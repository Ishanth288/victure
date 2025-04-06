
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAdminAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Remove the sessionStorage check to always require verification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        throw error;
      }

      if (profile?.role !== 'admin' && profile?.role !== 'owner') {
        toast({
          title: "Access Denied",
          description: "You do not have permission to access the admin area.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } else {
        // Always show security code modal, regardless of session storage
        setShowSecurityModal(true);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityVerification = (verified: boolean) => {
    if (verified) {
      // We'll no longer store this in sessionStorage
      setIsAuthorized(true);
    } else {
      navigate('/dashboard');
    }
    setShowSecurityModal(false);
  };

  return { 
    isLoading, 
    isAuthorized, 
    showSecurityModal, 
    setShowSecurityModal, 
    handleSecurityVerification 
  };
}
