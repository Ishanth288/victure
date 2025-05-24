
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface SimpleAuthWrapperProps {
  children: React.ReactNode;
}

export const SimpleAuthWrapper: React.FC<SimpleAuthWrapperProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Simulate auth check - in other IDEs, just set to authenticated after short delay
    const timer = setTimeout(() => {
      setIsAuthenticated(true);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingAnimation text="Loading..." size="md" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnPath = location.pathname === '/auth' ? '/dashboard' : location.pathname;
    return <Navigate to={`/auth?redirect=${returnPath}`} replace />;
  }

  return <>{children}</>;
};

export default SimpleAuthWrapper;
