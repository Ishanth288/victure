
import { AuthCheck, MainContent, SidebarContainer } from "@/components/dashboard/layout";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthCheck>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SidebarContainer />
        <MainContent>
          {children}
        </MainContent>
        <OnboardingTour />
      </div>
    </AuthCheck>
  );
}
