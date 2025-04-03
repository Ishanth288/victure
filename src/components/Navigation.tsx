
import { Button } from "@/components/ui/button";
import { HashLink } from 'react-router-hash-link';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home } from "lucide-react";

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthPage, setIsAuthPage] = useState(false);

  useEffect(() => {
    // Check if current page is auth page
    setIsAuthPage(location.pathname === '/auth');
  }, [location.pathname]);

  const handleLogin = () => {
    navigate('/auth', { state: { isLogin: true } });
  };

  const handleGetStarted = () => {
    // If we're on the home page, scroll to pricing section
    if (location.pathname === '/') {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to home and then to pricing
      navigate('/#pricing');
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

          {/* Only show these buttons on the home page */}
          {location.pathname === '/' && (
            <div className="flex items-center space-x-4">
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
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
