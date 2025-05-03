
import { AuthWrapper } from "@/components/AuthWrapper";
import { MainContent } from "@/components/dashboard/layout/MainContent";
import { SidebarContainer } from "@/components/dashboard/layout/SidebarContainer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { Toaster } from "@/components/ui/toaster";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthWrapper>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer />
        <MainContent>
          <div className="container mx-auto max-w-7xl">
            <AnnouncementBanner />
            {children}
          </div>
        </MainContent>
      </div>
      <Toaster />
    </AuthWrapper>
  );
}
