
import { AuthWrapper } from "@/components/AuthWrapper";
import { MainContent } from "@/components/dashboard/layout/MainContent";
import { SidebarContainer } from "@/components/dashboard/layout/SidebarContainer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthWrapper>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer />
        <MainContent>
          <div className="container px-4 py-4 mx-auto">
            <AnnouncementBanner />
            {children}
          </div>
        </MainContent>
      </div>
    </AuthWrapper>
  );
}
