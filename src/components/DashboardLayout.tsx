
import { AuthWrapper } from "@/components/AuthWrapper";
import { MainContent } from "@/components/dashboard/layout/MainContent";
import { SidebarContainer } from "@/components/dashboard/layout/SidebarContainer";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthWrapper>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer />
        <MainContent>
          {children}
        </MainContent>
      </div>
    </AuthWrapper>
  );
}
