
import { Button } from "@/components/ui/button";
import { HashLink } from 'react-router-hash-link';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if URL contains signup parameter
    const searchParams = new URLSearchParams(location.search);
    const shouldSignup = searchParams.get('signup') === 'true';
    
    if (shouldSignup && location.pathname === '/auth') {
      // If we're on the auth page with signup param, set isLogin to false
      navigate('/auth', { state: { isLogin: false }, replace: true });
    }
  }, [location, navigate]);

  const handleLogin = () => {
    navigate('/auth', { state: { isLogin: true } });
  };

  const handleGetStarted = () => {
    navigate('/auth', { state: { isLogin: false } });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <HashLink to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Victure</span>
          </HashLink>

          <div className="hidden md:flex items-center space-x-8">
            <HashLink smooth to="#features" className="text-neutral-600 hover:text-primary transition-colors">
              Features
            </HashLink>
            <HashLink smooth to="#benefits" className="text-neutral-600 hover:text-primary transition-colors">
              Benefits
            </HashLink>
            <HashLink smooth to="#pricing" className="text-neutral-600 hover:text-primary transition-colors">
              Pricing
            </HashLink>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-neutral-600 hover:text-primary"
              onClick={handleLogin}
            >
              Login
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
