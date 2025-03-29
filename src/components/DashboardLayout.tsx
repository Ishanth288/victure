
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PlanBanner } from "@/components/PlanBanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { SidebarLinks, sidebarLinksData } from "@/components/dashboard/SidebarLinks";
import { ProfileSection, useProfileData } from "@/components/dashboard/ProfileSection";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { profileData } = useProfileData();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleTermsClick = () => {
    window.open('https://www.termsfeed.com/live/661b4717-faf2-4a61-a219-ddc2010a943c', '_blank');
  };

  const handleLinkClick = (index: number) => {
    // Handle special links
    if (index === 9) { // Terms & Conditions
      handleTermsClick();
    } else if (index === 10) { // Sign Out
      handleSignOut();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={isSidebarOpen} setOpen={setIsSidebarOpen}>
        <SidebarBody className="justify-between gap-4">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <DashboardHeader 
              title="Dashboard"
              pharmacyName={profileData?.pharmacy_name || 'Medplus'}
              isSidebarOpen={isSidebarOpen}
            />
            
            <div className="mt-2 flex flex-col gap-1 px-2">
              <SidebarLinks startIndex={0} endIndex={8} />
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-2 px-2 flex flex-col gap-1">
            <SidebarLinks startIndex={8} endIndex={11} onClick={handleLinkClick} />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex items-center h-16 px-6 border-b bg-white shadow-sm">
          <div className="text-2xl font-bold text-neutral-900 text-center w-full">
            Victure Healthcare Solutions
          </div>
          <ProfileSection />
        </header>
        
        <main className="p-4 md:p-6 overflow-y-auto flex-1">
          <PlanBanner />
          <ScrollArea className="h-full">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
