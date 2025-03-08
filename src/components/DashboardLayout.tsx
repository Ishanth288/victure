
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "./BackButton";
import {
  LayoutGrid, Package, Users, FileText, LineChart, Settings, Menu,
  X, DollarSign, LogOut, ShoppingCart, FileTerminal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlanBanner } from "@/components/PlanBanner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <BackButton />
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-neutral-200 w-64 md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <Link to="/dashboard" className="pl-2 flex items-center">
            <span className="text-lg font-medium text-primary">
              {profileData?.pharmacy_name || 'Medplus'}
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="flex flex-col h-[calc(100%-4rem)] justify-between">
          <ScrollArea className="flex-1">
            <nav className="p-4 space-y-2">
              <Link to="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/inventory">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-5 w-5" />
                  Inventory
                </Button>
              </Link>
              <Link to="/billing">
                <Button variant="ghost" className="w-full justify-start">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Billing
                </Button>
              </Link>
              <Link to="/prescriptions">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="mr-2 h-5 w-5" />
                  Prescriptions
                </Button>
              </Link>
              <Link to="/patients">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-5 w-5" />
                  Patients
                </Button>
              </Link>
              <Link to="/purchases">
                <Button variant="ghost" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Purchases
                </Button>
              </Link>
              <Link to="/insights">
                <Button variant="ghost" className="w-full justify-start">
                  <LineChart className="mr-2 h-5 w-5" />
                  Insights
                </Button>
              </Link>
            </nav>
          </ScrollArea>

          <div className="p-4 space-y-2 border-t border-neutral-200">
            <Link to="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start" onClick={handleTermsClick}>
              <FileTerminal className="mr-2 h-5 w-5" />
              Terms & Conditions
            </Button>
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 ${isSidebarOpen ? "md:ml-64" : ""}`}>
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-white shadow-sm">
          <div className="flex items-center h-16">
            <div className="flex items-center justify-between w-full px-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <div className="flex-1 flex justify-center">
                <span className="text-2xl font-bold text-neutral-900">
                  Victure Healthcare Solutions
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {profileData?.owner_name || 'Loading...'}
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <PlanBanner />
          <ScrollArea className="h-full">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
