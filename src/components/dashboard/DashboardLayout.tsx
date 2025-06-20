
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
        console.log("Checking auth session...");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.warn("Session check error:", error.message);
          setConnectionError(true);
        } else {
          setSession(currentSession);
          setConnectionError(false);
          if (!currentSession) {
            const returnPath = location.pathname === '/auth' ? '/dashboard' : location.pathname;
            navigate(`/auth?redirect=${returnPath}`);
          }
        }
      } catch (error: any) {
        console.warn("Auth initialization error:", error.message);
        if (mounted) {
          setConnectionError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      console.log("Auth state changed:", event);
      setSession(currentSession);
      setConnectionError(false);
      if (event === 'SIGNED_IN' && !loading) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate, toast, loading]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - completing');
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoadingAnimation size="md" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
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
