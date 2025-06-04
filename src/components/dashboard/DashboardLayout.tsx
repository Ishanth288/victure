import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { useToast } from '@/hooks/use-toast';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: AuthWrapperProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Add connection timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session: currentSession }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (!mounted) return;

        if (error) {
          console.error("Session check error:", error);
          setConnectionError(true);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setConnectionError(false);
        
        if (!currentSession) {
          const returnPath = location.pathname === '/auth' ? '/dashboard' : location.pathname;
          navigate(`/auth?redirect=${returnPath}`);
        }

      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setConnectionError(true);
          setLoading(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setConnectionError(false);
      
      if (event === 'SIGNED_IN' && !loading) {
        toast({
          title: "Login Successful",
          description: "You have been successfully logged in.",
          variant: "default",
        });
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate, toast, loading]);

  // Force timeout to prevent infinite loading
  useEffect(() => {
    const forceLoadTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ DashboardLayout loading timeout - forcing completion');
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(forceLoadTimeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingAnimation text="Loading dashboard..." size="md" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Connection Issue</h2>
          <p className="text-gray-600 mb-4">There was a problem connecting to the server.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to auth
  }

  return <>{children}</>;
} 