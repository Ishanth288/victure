
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "./BackButton";
import {
  LayoutGrid, Package, Users, FileText, BarChart3, Settings, Menu,
  X, DollarSign, Pill, LogOut, LineChart, ShoppingCart, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    // Listen for pharmacy name updates
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

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <BackButton />
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-neutral-200 w-64 md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <div className="pl-12"> {/* Added padding to avoid back button */}
            <span className="text-lg font-medium text-primary">
              {profileData?.pharmacy_name || 'Loading...'}
            </span>
          </div>
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

          <div className="p-4 space-y-2 border-t border-neutral-200">
            <Link to="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-5 w-5" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : ""
      }`}>
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center h-16">
            <div className="flex items-center w-full">
              {/* Left section with back button space and pharmacy name */}
              <div className="w-20"></div> {/* Increased space for back button */}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <span className="text-lg font-medium text-primary ml-6">
                  {profileData?.pharmacy_name || 'Loading...'}
                </span>
              </div>

              {/* Center section with company name */}
              <div className="flex-1 flex justify-center">
                <span className="text-2xl font-bold text-neutral-900">
                  Victure Healthcare Solutions
                </span>
              </div>

              {/* Right section with user info and logout */}
              <div className="flex items-center space-x-4 px-4">
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

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
