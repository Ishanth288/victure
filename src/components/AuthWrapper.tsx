
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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  console.log('🔍 AuthWrapper: Rendering with state:', { 
    isLoading, 
    isAuthenticated, 
    currentPath: location.pathname,
    connectionError
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Reduced timeout for faster response
    const INIT_TIMEOUT = 8000; // 8 seconds instead of 15

    // Timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ AuthWrapper: Timeout triggered - completing load');
        setIsLoading(false);
        setIsAuthenticated(false);
        
        if (location.pathname !== '/auth' && location.pathname !== '/') {
          navigate('/');
        }
      }
    }, INIT_TIMEOUT);

    const initializeAuth = async () => {
      try {
        console.log('🔄 AuthWrapper: Starting authentication check...');
        setConnectionError(null);
        
        // Quick session check with reduced timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout after 3 seconds')), 3000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);

        // Clear timeout if successful
        if (timeoutId) clearTimeout(timeoutId);

        if (!mounted) return;

        console.log('✅ AuthWrapper: Session check completed', { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          currentPath: location.pathname 
        });

        if (error) {
          console.error('❌ AuthWrapper: Session error:', error);
          setConnectionError(error.message);
          
          // For auth errors, still allow access to public pages
          setIsAuthenticated(false);
          setIsLoading(false);
          
          if (location.pathname !== '/auth' && location.pathname !== '/') {
            navigate('/');
          }
          return;
        }

        if (session?.user) {
          console.log('✅ AuthWrapper: User authenticated:', session.user.id);
          setIsAuthenticated(true);
          
          // If on auth page and authenticated, redirect to dashboard
          if (location.pathname === '/auth') {
            navigate('/');
          }
        } else {
          console.log('ℹ️ AuthWrapper: No authenticated user');
          setIsAuthenticated(false);
          
          // Only redirect to auth if not on public pages
          if (location.pathname !== '/auth' && location.pathname !== '/') {
            navigate('/auth');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ AuthWrapper: Critical initialization error:', error);
        
        // Clear timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
          setConnectionError(errorMessage);
          
          // For critical errors, allow access to the landing page
          setIsAuthenticated(false);
          setIsLoading(false);
          
          if (location.pathname !== '/') {
            navigate('/');
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
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-6 mx-auto"></div>
          
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Loading Victure
          </h2>
          <p className="text-gray-600 text-lg mb-2">Connecting to your pharmacy system...</p>
          
          {connectionError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                <strong>Connection Issue:</strong> {connectionError}
              </p>
            </div>
          )}
          
          <div className="mt-6 space-y-3">
            {/* Quick bypass for demo */}
            <button 
              onClick={() => {
                console.log('🚀 Demo: Bypassing authentication');
                setIsLoading(false);
                setIsAuthenticated(false);
                setConnectionError(null);
                navigate('/');
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Demo
            </button>
            
            {/* Debug bypass */}
            <button 
              onClick={() => {
                console.log('🔧 Debug: Force bypass');
                setIsLoading(false);
                setIsAuthenticated(false);
                setConnectionError(null);
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Force Continue (Debug)
            </button>
            
            {/* Reload page */}
            <button 
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Reload Page
            </button>
          </div>
          
          <p className="text-gray-500 text-xs mt-4">
            Having trouble? The demo will work without authentication.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
