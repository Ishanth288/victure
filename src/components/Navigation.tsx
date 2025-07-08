
import { Button } from "@/components/ui/button";
import { HashLink } from 'react-router-hash-link';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthPage, setIsAuthPage] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsAuthPage(location.pathname === '/auth');

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        console.log('Navigation: Auth check complete, isLoggedIn:', !!session);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        console.log('Navigation: Auth state changed, isLoggedIn:', !!session);
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
            variant: "default",
          });
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [location.pathname, toast]);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Login button clicked');
    navigate('/auth', { state: { isLogin: true } });
  };

  const handleDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Dashboard button clicked');
    navigate('/dashboard');
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Sign out button clicked');
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const showHomeButton = location.pathname !== '/';

  if (isAuthPage) {
    return (
      <nav className="py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold text-primary">Victure</span>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            {showHomeButton && (
              <Link to="/" className="mr-2">
                <Button variant="ghost" size="icon" className="text-primary">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <HashLink to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">Victure</span>
            </HashLink>
          </div>

          {location.pathname === '/' && (
            <div className="hidden md:flex items-center space-x-6">
              <HashLink smooth to="#features" className="text-neutral-600 hover:text-primary transition-colors">
                Features
              </HashLink>
              <HashLink smooth to="#benefits" className="text-neutral-600 hover:text-primary transition-colors">
                Benefits
              </HashLink>
              <HashLink smooth to="#pricing" className="text-neutral-600 hover:text-primary transition-colors">
                Pricing
              </HashLink>
              <Link to="/documentation" className="text-neutral-600 hover:text-primary transition-colors">
                Documentation
              </Link>
              <HashLink smooth to="#scroll-animation" className="text-neutral-600 hover:text-primary transition-colors">
                About Us
              </HashLink>
              <HashLink smooth to="#footer" className="text-neutral-600 hover:text-primary transition-colors">
                Legal
              </HashLink>
            </div>
          )}

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-gray-200"></div>
            ) : isLoggedIn ? (
              <>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleDashboard}
                  type="button"
                >
                  Dashboard
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-dark text-white"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleLogin}
                  type="button"
                >
                  Login
                </Button>
                <HashLink smooth to="#pricing">
                  <Button className="bg-primary hover:bg-primary-dark text-white">
                    Get Started
                  </Button>
                </HashLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
