
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // First set up the auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      
      // Show login success message but avoid showing on initial page load
      if (event === 'SIGNED_IN' && !loading) {
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
          variant: "success",
        });
      }
    });

    // Then check for existing session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (err) {
        console.error("Session check error:", err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingAnimation text="Authenticating..." size="md" />
      </div>
    );
  }

  if (!session) {
    // Store the current location to redirect back after login
    const returnPath = location.pathname === '/auth' ? '/dashboard' : location.pathname;
    return <Navigate to={`/auth?redirect=${returnPath}`} replace />;
  }

  return <>{children}</>;
};

export default AuthWrapper;
