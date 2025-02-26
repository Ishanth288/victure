import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Package,
  Users,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  DollarSign,
  Pill,
  LogOut,
  LineChart,
  ShoppingCart
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
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-neutral-200 w-64 md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">
              {profileData?.pharmacy_name || 'Loading...'}
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
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </nav>
      </aside>

      <div className={`transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : ""
      }`}>
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center space-x-4 ml-auto">
              <span className="text-sm font-medium">
                {profileData?.owner_name || 'Loading...'}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
