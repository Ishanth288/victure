
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

  console.log('🔍 AuthWrapper: Starting initialization', { pathname: location.pathname });

  useEffect(() => {
    let mounted = true;
    let subscription: any;
    
    // Much shorter fallback timeout to prevent blocking UI
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ AuthWrapper: Fallback timeout, continuing without auth check');
        setIsLoading(false);
      }
    }, 500); // Reduced to 500ms

    const quickAuthCheck = async () => {
      try {
        console.log('🔄 AuthWrapper: Quick auth check...');
        
        // Very short timeout for auth check
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 300); // Only 300ms
        });
        
        const authPromise = supabase.auth.getSession();
        
        const sessionResult = await Promise.race([authPromise, timeoutPromise]);
        const { data: { session }, error } = sessionResult as any;
        
        if (error) {
          console.warn('Auth error, continuing without auth:', error.message);
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
          
          // Only redirect if we're on a protected route, not on home page
          if (location.pathname !== '/auth' && location.pathname !== '/' && !location.pathname.startsWith('/legal')) {
            navigate('/auth');
          }
        }
        
        setIsLoading(false);
        clearTimeout(fallbackTimeout);
        console.log('✅ AuthWrapper: Quick initialization complete');
        
      } catch (error: any) {
        console.warn('Auth check failed, continuing without auth:', error.message);
        setIsLoading(false);
        setIsAuthenticated(false);
        
        // Only redirect if we're on a protected route, not on home page
        if (location.pathname !== '/auth' && location.pathname !== '/' && !location.pathname.startsWith('/legal')) {
          navigate('/auth');
        }
      }
    };

    const setupAuth = async () => {
      if (!mounted) return;
      
      await quickAuthCheck();
      
      if (!mounted) return;

      // Set up auth state listener with minimal error handling
      try {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
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
            
            // Only redirect if we're on a protected route, not on home page
            if (location.pathname !== '/auth' && location.pathname !== '/' && !location.pathname.startsWith('/legal')) {
              navigate('/auth');
            }
          }
        });
        
        subscription = data.subscription;
      } catch (error) {
        console.warn('Auth listener setup failed, app will continue:', error);
        setIsLoading(false);
      }
    };

    setupAuth();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array

  // Much faster loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3 mx-auto"></div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Loading</h2>
          <p className="text-sm text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
