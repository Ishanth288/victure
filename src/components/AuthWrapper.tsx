
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

  console.log('🔍 AuthWrapper: Starting initialization');

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthWrapper: Checking session...');
        
        // Simple session check without timeout race condition
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ AuthWrapper: Session error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ AuthWrapper: User authenticated');
          setIsAuthenticated(true);
          
          if (location.pathname === '/auth') {
            navigate('/dashboard');
          }
        } else {
          console.log('ℹ️ AuthWrapper: No authenticated user');
          setIsAuthenticated(false);
          
          if (location.pathname !== '/auth' && location.pathname !== '/') {
            navigate('/auth');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ AuthWrapper: Initialization error:', error);
        
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        
        if (location.pathname === '/auth') {
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        
        if (location.pathname !== '/auth' && location.pathname !== '/') {
          navigate('/auth');
        }
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-6 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Victure</h2>
          <p className="text-gray-600 text-lg">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
