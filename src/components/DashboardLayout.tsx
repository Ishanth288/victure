
import { AuthWrapper } from "@/components/AuthWrapper";
import { MainContent } from "@/components/dashboard/layout/MainContent";
import { SidebarContainer } from "@/components/dashboard/layout/SidebarContainer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { usePreloadData } from "@/hooks/usePreloadData";
import { LoadingAnimation } from "@/components/ui/loading-animation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDataLoaded } = usePreloadData();

  if (!isDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingAnimation size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <AuthWrapper>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer />
        <MainContent>
          <div className="container mx-auto px-4 py-4">
            <AnnouncementBanner />
            {children}
          </div>
        </MainContent>
      </div>
    </AuthWrapper>
  );
}
