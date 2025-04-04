
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { ErrorFallback } from "@/components/ui/fallback";

interface AuthCheckProps {
  children: React.ReactNode;
}

export function AuthCheck({ children }: AuthCheckProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkAuth();
  }, [retryCount]);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Set up Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          console.log("No active session found, redirecting to auth page");
          navigate('/auth');
        } else {
          setIsAuthenticated(true);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Auth state change error:", error);
        setError(error.message);
        setIsLoading(false);
      });
      
      // Return cleanup function to unsubscribe
      return unsubscribe;
    } catch (err: any) {
      console.error("Auth check error:", err);
      setError(err.message || "Authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingAnimation text="Authenticating..." size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorFallback 
          message="Authentication Error" 
          error={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
