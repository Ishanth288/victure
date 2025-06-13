
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  console.log('🔍 AuthWrapper: Current state:', { 
    isLoading, 
    isAuthenticated, 
    currentPath: location.pathname
  });

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthWrapper: Checking authentication...');
        
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ AuthWrapper: Session error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ AuthWrapper: User authenticated:', session.user.id);
          setIsAuthenticated(true);
          
          // If on auth page and authenticated, redirect to dashboard
          if (location.pathname === '/auth') {
            navigate('/dashboard');
          }
        } else {
          console.log('ℹ️ AuthWrapper: No authenticated user');
          setIsAuthenticated(false);
          
          // Only redirect to auth if trying to access protected routes
          const protectedRoutes = ['/dashboard', '/inventory', '/patients', '/prescriptions', '/insights', '/billing'];
          if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
            navigate('/auth');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ AuthWrapper: Critical error:', error);
        
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        
        if (location.pathname === '/auth') {
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setIsLoading(false);
        
        const protectedRoutes = ['/dashboard', '/inventory', '/patients', '/prescriptions', '/insights', '/billing'];
        if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
          navigate('/auth');
        }
      }
    });

    initializeAuth();

    // Cleanup timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ AuthWrapper: Loading timeout - setting default state');
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigate, location.pathname]);

  // Simple loading state without complex UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
