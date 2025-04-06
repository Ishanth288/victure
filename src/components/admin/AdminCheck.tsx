
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SecurityCodeModal } from "@/components/admin/SecurityCodeModal";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface AdminCheckProps {
  children: React.ReactNode;
}

export function AdminCheck({ children }: AdminCheckProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true);
      
      // Remove sessionStorage check to always require verification
      
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
        setIsSecurityModalOpen(true);
      }
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description: "Failed to verify admin access: " + (error.message || "Unknown error"),
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityVerification = (verified: boolean) => {
    if (verified) {
      // Don't store in sessionStorage anymore
      setIsAuthenticated(true);
    } else {
      navigate('/dashboard');
    }
    setIsSecurityModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <LoadingAnimation text="Verifying admin credentials" size="lg" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? children : null}
      <SecurityCodeModal 
        isOpen={isSecurityModalOpen}
        onClose={() => {
          setIsSecurityModalOpen(false);
          navigate('/dashboard');
        }}
        onVerified={handleSecurityVerification}
      />
    </>
  );
}
