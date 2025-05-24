
import { MainContent } from "@/components/dashboard/layout/MainContent";
import { SidebarContainer } from "@/components/dashboard/layout/SidebarContainer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SidebarContainer />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <MainContent>
          <div className="container mx-auto px-4 py-4">
            <AnnouncementBanner />
            {children}
          </div>
        </MainContent>
      </div>
    </div>
  );
}
