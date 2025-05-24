
import { ReactNode } from "react";

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  // Simplified wrapper - no auth logic for now
  return <>{children}</>;
};

export default AuthWrapper;
