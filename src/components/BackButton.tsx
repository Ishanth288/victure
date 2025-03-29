
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function BackButton() {
  const navigate = useNavigate();
  const [pathname, setPathname] = useState('');
  
  useEffect(() => {
    // Get current path without relying on useLocation
    setPathname(window.location.pathname);
    
    // Update when location changes
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Don't show back button on index page
  if (pathname === '/') {
    return null;
  }

  const handleBack = () => {
    // If there's a previous page in history, go back
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // If no history, navigate to a default page based on context
      if (pathname.includes('/dashboard')) {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50"
      onClick={handleBack}
    >
      <ChevronLeft className="h-6 w-6" />
    </Button>
  );
}
