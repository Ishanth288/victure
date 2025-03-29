
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SecurityCodeModal } from "@/components/admin/SecurityCodeModal";
import { useToast } from "@/hooks/use-toast";

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if the user has verified admin access previously in this session
      const adminVerified = sessionStorage.getItem('adminVerified') === 'true';
      
      if (adminVerified) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsSecurityModalOpen(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const handleSecurityVerification = (verified: boolean) => {
    if (verified) {
      sessionStorage.setItem('adminVerified', 'true');
      setIsAuthenticated(true);
    } else {
      navigate('/dashboard');
    }
    setIsSecurityModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Verifying admin credentials...</p>
        </div>
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
        onVerified={(verified) => handleSecurityVerification(verified)}
      />
    </>
  );
}
