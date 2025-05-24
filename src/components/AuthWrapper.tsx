
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { loading } = useAuth();

  // Simple loading state without blocking
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Always render children - no auth blocking for now
  return <>{children}</>;
};

export default AuthWrapper;
