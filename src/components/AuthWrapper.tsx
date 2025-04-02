import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const session = useSession();
  const supabaseClient = useSupabaseClient();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      try {
        if (!session) {
          // If no session exists, check if there's a refresh token in the URL
          const params = new URLSearchParams(location.search);
          const refreshToken = params.get('refresh_token');

          if (refreshToken) {
            // Try to refresh the session using the refresh token
            const { error } = await supabaseClient.auth.refreshSession({ refresh_token: refreshToken });

            if (error) {
              console.error("Failed to refresh session:", error);
              // Redirect to login if refresh fails
              return;
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [session, supabaseClient, location.search]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    // Redirect to the authentication page and pass the current location
    return <Navigate to={`/auth?redirect=${location.pathname}${location.search}`} replace />;
  }

  // Add the query parameter to the redirect URL after successful authentication
  const redirectUrl = `/dashboard?just_logged_in=true`;

  return children;
};

export default AuthWrapper;
