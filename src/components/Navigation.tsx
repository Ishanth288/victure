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
    // Check if current page is auth page
    setIsAuthPage(location.pathname === '/auth');

    // Check if user is logged in
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed Out",
            description: "You have been successfully signed out.",
            variant: "info",
          });
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [location.pathname, toast]);

  const handleLogin = () => {
    navigate('/auth', { state: { isLogin: true } });
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const handleSignOut = async () => {
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

  // Show home button on all pages except the index page
  const showHomeButton = location.pathname !== '/';

  // Simplified navigation for auth pages
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

          {/* Only show these navigation links on the home page */}
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
              <HashLink smooth to="#scroll-animation" className="text-neutral-600 hover:text-primary transition-colors">
                About Us
              </HashLink>
              <HashLink smooth to="#footer" className="text-neutral-600 hover:text-primary transition-colors">
                Legal
              </HashLink>
            </div>
          )}

          {/* Conditional buttons based on auth state */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-gray-200"></div>
            ) : isLoggedIn ? (
              <>
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary/10"
                  onClick={handleDashboard}
                >
                  Dashboard
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary-dark text-white"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              location.pathname === '/' && (
                <>
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={handleLogin}
                  >
                    Login
                  </Button>
                  <HashLink smooth to="#pricing">
                    <Button className="bg-primary hover:bg-primary-dark text-white">
                      Get Started
                    </Button>
                  </HashLink>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
