
import { MaintenanceChecker } from "@/components/admin/MaintenanceChecker";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <MaintenanceChecker>
      {children}
    </MaintenanceChecker>
  );
}
