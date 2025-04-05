
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAdminAccess() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if admin verification was already done in this session
      const adminVerified = sessionStorage.getItem('adminVerified') === 'true';
      
      if (adminVerified) {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }
      
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
        setIsAuthorized(true);
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

  return { isLoading, isAuthorized };
}
