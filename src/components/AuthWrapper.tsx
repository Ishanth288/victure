
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Remove supabase client import if no longer directly used here
// import { supabase } from "@/integrations/supabase/client"; 
// Remove useToast if not used after refactor, or keep if still needed for other purposes
// import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { loading: authLoading, user, session } = useAuth(); // Use state from useAuth
  const navigate = useNavigate();
  const location = useLocation();
  // const { toast } = useToast(); // Remove if not used

  console.log('🔍 AuthWrapper: Initializing with context state', { authLoading, user: !!user, session: !!session, pathname: location.pathname });

  useEffect(() => {
    if (!authLoading) {
      console.log('🔄 AuthWrapper: Auth context loaded.', { user: !!user, pathname: location.pathname });
      if (user) { // User is authenticated
        console.log('✅ AuthWrapper: User authenticated via context.');
        if (location.pathname === '/auth') {
          console.log('🔄 AuthWrapper: Redirecting from /auth to /dashboard');
          navigate('/dashboard');
        }
      } else { // No authenticated user
        console.log('ℹ️ AuthWrapper: No authenticated user via context.');
        // Only redirect if we're on a protected route, not on home page or legal pages
        const isProtectedRoute = location.pathname !== '/auth' && 
                               location.pathname !== '/' && 
                               !location.pathname.startsWith('/legal');

        if (isProtectedRoute) {
          console.log('🔄 AuthWrapper: Redirecting to /auth from protected route:', location.pathname);
          navigate('/auth');
        }
      }
    }
  }, [authLoading, user, location.pathname, navigate]);

  if (authLoading) {
    console.log('⏳ AuthWrapper: Showing loading spinner (from context)');
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
  console.log('✅ AuthWrapper: Rendering children.');
  return <>{children}</>;
}
