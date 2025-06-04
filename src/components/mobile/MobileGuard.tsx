
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If on mobile and trying to access desktop routes, redirect to mobile dashboard
    if (isMobile && !location.pathname.startsWith('/mobile') && location.pathname !== '/auth' && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    
    // If on desktop and trying to access mobile routes, redirect to dashboard
    if (!isMobile && location.pathname.startsWith('/mobile')) {
      navigate('/dashboard', { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);

  return <>{children}</>;
}
