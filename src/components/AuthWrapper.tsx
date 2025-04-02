
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        // Get the current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          return;
        }

        setSession(currentSession);

        if (!currentSession) {
          // If no session exists, check if there's a refresh token in the URL
          const params = new URLSearchParams(location.search);
          const refreshToken = params.get('refresh_token');

          if (refreshToken) {
            // Try to refresh the session using the refresh token
            const { error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

            if (refreshError) {
              console.error("Failed to refresh session:", refreshError);
              // Redirect to login if refresh fails
              return;
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      
      // Show login success message
      if (event === 'SIGNED_IN') {
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
          variant: "success",
        });
      }
    });

    checkSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [location.search, toast]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    // Redirect to the authentication page and pass the current location
    return <Navigate to={`/auth?redirect=${location.pathname}${location.search}`} replace />;
  }

  return children;
};

export default AuthWrapper;
