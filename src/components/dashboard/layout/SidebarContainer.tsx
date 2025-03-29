
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import { SidebarLinks } from "@/components/dashboard/SidebarLinks";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useProfileData } from "@/components/dashboard/ProfileSection";

interface SidebarContainerProps {
  children?: React.ReactNode;
}

export function SidebarContainer({ children }: SidebarContainerProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { profileData } = useProfileData();

  const handleTermsClick = () => {
    window.open('https://www.termsfeed.com/live/661b4717-faf2-4a61-a219-ddc2010a943c', '_blank');
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLinkClick = (index: number) => {
    // Handle special links
    if (index === 9) { // Terms & Conditions
      handleTermsClick();
    } else if (index === 10) { // Sign Out
      handleSignOut();
    }
  };

  return (
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
  );
}
