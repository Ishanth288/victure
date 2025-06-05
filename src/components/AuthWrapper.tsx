
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session with extended timeout
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Auth session error:', error);
          toast({
            title: "Authentication Error",
            description: "Failed to verify session. Please try again.",
            variant: "destructive",
          });
          
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
            
            if (location.pathname !== '/auth') {
              navigate('/auth');
            }
          }
          return;
        }

        if (session?.user) {
          setIsAuthenticated(true);
          
          // If on auth page and authenticated, redirect to dashboard
          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else {
          setIsAuthenticated(false);
          
          // If not on auth page and not authenticated, redirect to auth
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        if (mounted) {
          toast({
            title: "Connection Error",
            description: "Failed to initialize authentication. Please refresh the page.",
            variant: "destructive",
          });
          setIsAuthenticated(false);
          setIsLoading(false);
          
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true);
          setIsLoading(false);
          
          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else if (event === 'SIGNED_OUT' || !session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          
          if (location.pathname !== '/auth') {
            navigate('/auth');
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Session refreshed successfully
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        // Just log the error, don't show toast for state changes
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
