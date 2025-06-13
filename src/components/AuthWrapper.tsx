
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  console.log('🔍 AuthWrapper: Starting initialization', { pathname: location.pathname });

  const withConnectionTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs / 1000} seconds`)), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }, []);

  const handleConnectionError = useCallback((error: any) => {
    console.error('❌ AuthWrapper: Connection error:', error);
    setConnectionError(true);
    console.warn('Connection issues detected. Attempting to recover...');
  }, []); // Removed retryCount dependency to prevent infinite loops

  useEffect(() => {
    let mounted = true;
    let subscription: any;
    
    // Fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ AuthWrapper: Fallback timeout reached, forcing app to load');
        setIsLoading(false);
        setConnectionError(true);
        if (location.pathname !== '/auth' && location.pathname !== '/') {
          navigate('/auth');
        }
      }
    }, 10000); // 10 second maximum loading time

    const initializeAuth = async (attempt: number = 0) => {
      try {
        console.log(`🔄 AuthWrapper: Checking session (attempt ${attempt + 1})...`);
        
        // Add connection timeout to session check
        const sessionResult = await withConnectionTimeout(
          supabase.auth.getSession(),
          10000 // Increased timeout to 10 seconds
        );

        const { data: { session }, error } = sessionResult;
        console.log('📊 Session result:', { session: !!session, error: error?.message });

        if (error) {
          throw error;
        }

        // Reset connection error state on successful connection
        setConnectionError(false);
        setRetryCount(0);

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
        clearTimeout(fallbackTimeout); // Clear fallback timeout on success
        console.log('✅ AuthWrapper: Initialization complete');
      } catch (error: any) {
        console.error('❌ AuthWrapper error:', error.message);
        handleConnectionError(error);
        
        // Implement exponential backoff for retries
        if (attempt < 2) { // Increased to max 3 attempts (0, 1, 2)
          const delay = Math.min(2000 * Math.pow(2, attempt), 8000); // Max delay 8s
          console.log(`⏳ Retrying in ${delay}ms...`);
          
          setTimeout(() => {
            if (mounted) {
              setRetryCount(prev => prev + 1);
              initializeAuth(attempt + 1);
            }
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached. Proceeding without auth.');
          // Allow app to load without authentication
          setIsLoading(false);
          setIsAuthenticated(false);
          setConnectionError(true);
          
          // Navigate to auth page if not already there
          if (location.pathname !== '/auth' && location.pathname !== '/') {
            navigate('/auth');
          }
        }
      }
    };

    const setupAuth = async () => {
      if (!mounted) return;
      
      await initializeAuth();
      
      if (!mounted) return;

      // Set up auth state listener with error handling
      try {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', event);

          if (event === 'SIGNED_IN' && session?.user) {
            setIsAuthenticated(true);
            setIsLoading(false);
            setConnectionError(false);
            
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
        
        subscription = data.subscription;
      } catch (error) {
        console.error('❌ Failed to set up auth state listener:', error);
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
  }, []); // Empty dependency array to run only once on mount

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center max-w-md px-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-6 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Loading Victure</h2>
          {connectionError ? (
            <div className="space-y-2">
              <p className="text-amber-600 text-lg">Connection issues detected...</p>
              <p className="text-gray-600 text-sm">Attempting to reconnect (attempt {retryCount + 1}/3)</p>
            </div>
          ) : (
            <p className="text-gray-600 text-lg">Please wait...</p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
