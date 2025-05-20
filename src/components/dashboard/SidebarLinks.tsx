
import { useNavigate, useLocation } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ButtonSkeleton } from "@/components/ui/loading-skeleton";
import { 
  LayoutDashboard, 
  PackageOpen, 
  FileText, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  BarChart2, 
  ShoppingBag, 
  LineChart, 
  LogOut,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";

export function SidebarLinks() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [linksVisible, setLinksVisible] = useState(false);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        // Show loading state immediately
        setIsLoading(true);
        
        // Check if admin verification was already done in this session
        const adminVerified = sessionStorage.getItem('adminVerified') === 'true';
        
        if (adminVerified) {
          setIsAdmin(true);
          setIsLoading(false);
          // Add a small delay before showing the links to ensure smooth transition
          setTimeout(() => setLinksVisible(true), 100);
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Error fetching profile:", error);
            setIsLoading(false);
            return;
          }
          
          if (profile && (profile.role === 'admin' || profile.role === 'owner')) {
            setIsAdmin(true);
            // Store admin status in session storage to avoid checking again
            sessionStorage.setItem('adminVerified', 'true');
          }
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
      } finally {
        setIsLoading(false);
        // Add a small delay before showing the links to ensure smooth transition
        setTimeout(() => setLinksVisible(true), 100);
      }
    };
    
    checkAdminRole();
  }, []);

  const isCurrentPath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const links = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      href: "/dashboard"
    },
    {
      title: "Inventory",
      icon: <PackageOpen className="mr-2 h-4 w-4" />,
      href: "/inventory"
    },
    {
      title: "Billing",
      icon: <FileText className="mr-2 h-4 w-4" />,
      href: "/billing"
    },
    {
      title: "Prescriptions",
      icon: <FileSpreadsheet className="mr-2 h-4 w-4" />,
      href: "/prescriptions"
    },
    {
      title: "Patients",
      icon: <Users className="mr-2 h-4 w-4" />,
      href: "/patients"
    },
    {
      title: "Purchases",
      icon: <ShoppingBag className="mr-2 h-4 w-4" />,
      href: "/purchases"
    },
    {
      title: "Insights", 
      icon: <LineChart className="mr-2 h-4 w-4" />,
      href: "/insights"
    },
    {
      title: "Business Optimization",
      icon: <BarChart2 className="mr-2 h-4 w-4" />,
      href: "/business-optimization"
    },
    {
      title: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      href: "/settings"
    }
  ];

  // Add admin link if user is admin
  const allLinks = isAdmin ? [
    ...links,
    {
      title: "Admin Portal",
      icon: <Shield className="mr-2 h-4 w-4" />,
      href: "/admin"
    }
  ] : links;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    navigate(href);
  };

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Clear admin verification on sign out
        sessionStorage.removeItem('adminVerified');
        // Clear pharmacy name from localStorage
        localStorage.removeItem('pharmacyName');
        
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account.",
          variant: "default",
        });
        navigate('/auth');
      }
    } catch (err: any) {
      console.error("Sign out error:", err);
      toast({
        title: "Error",
        description: "There was a problem signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      {isLoading ? (
        <ButtonSkeleton count={9} />
      ) : (
        <div className={`transition-opacity duration-300 ${linksVisible ? 'opacity-100' : 'opacity-0'}`}>
          {allLinks.map((link, index) => (
            <div key={index} className="flex flex-col">
              <a
                href={link.href}
                onClick={(e) => handleClick(e, link.href)}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  isCurrentPath(link.href)
                    ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-900"
                    : "hover:bg-green-50 hover:text-green-700",
                  "justify-start"
                )}
              >
                <div className="flex items-center">
                  {link.icon}
                  <span>{link.title}</span>
                </div>
              </a>
            </div>
          ))}
          
          {/* Add Sign Out link at the bottom */}
          <div className="mt-auto pt-4">
            <a
              href="#"
              onClick={handleSignOut}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "justify-start hover:bg-green-50 hover:text-green-700"
              )}
            >
              <div className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
