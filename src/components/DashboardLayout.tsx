import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid, Package, Users, FileText, LineChart, Settings, Menu,
  X, DollarSign, LogOut, ShoppingCart, FileTerminal, ChevronLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanBanner } from "@/components/PlanBanner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProfile();

    const handlePharmacyNameUpdate = () => {
      const updatedName = localStorage.getItem('pharmacyName');
      if (updatedName && profileData) {
        setProfileData({ ...profileData, pharmacy_name: updatedName });
      }
    };

    window.addEventListener('pharmacyNameUpdated', handlePharmacyNameUpdate);

    return () => {
      window.removeEventListener('pharmacyNameUpdated', handlePharmacyNameUpdate);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
    setIsLoading(false);
  };

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setProfileData(data);
        localStorage.setItem('pharmacyName', data.pharmacy_name);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleTermsClick = () => {
    window.open('https://www.termsfeed.com/live/661b4717-faf2-4a61-a219-ddc2010a943c', '_blank');
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      Loading...
    </div>;
  }

  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutGrid className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: <Package className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Billing",
      href: "/billing",
      icon: <DollarSign className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Prescriptions",
      href: "/prescriptions",
      icon: <FileText className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Patients",
      href: "/patients",
      icon: <Users className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Purchases",
      href: "/purchases",
      icon: <ShoppingCart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Insights",
      href: "/insights",
      icon: <LineChart className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Terms & Conditions",
      href: "#",
      icon: <FileTerminal className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    },
    {
      label: "Sign Out",
      href: "#",
      icon: <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={isSidebarOpen} setOpen={setIsSidebarOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex items-center h-16 px-4 border-b border-neutral-200">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={handleBack}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <span className="text-lg font-medium text-primary">
                  {profileData?.pharmacy_name || 'Medplus'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-col gap-2 px-2">
              {sidebarLinks.slice(0, 7).map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                />
              ))}
            </div>
          </div>
          
          <div className="border-t border-neutral-200 pt-4 px-2 flex flex-col gap-2">
            <SidebarLink
              link={sidebarLinks[7]} // Settings
            />
            <SidebarLink
              link={sidebarLinks[8]} // Terms
              className="cursor-pointer"
              onClick={handleTermsClick}
            />
            <SidebarLink
              link={sidebarLinks[9]} // Sign Out
              className="cursor-pointer"
              onClick={handleSignOut}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 flex items-center h-16 px-6 border-b bg-white shadow-sm">
          <div className="text-2xl font-bold text-neutral-900 text-center w-full">
            Victure Healthcare Solutions
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-4">
              {profileData?.owner_name || 'Loading...'}
            </span>
          </div>
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
