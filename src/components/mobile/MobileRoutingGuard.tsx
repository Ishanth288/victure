
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Prevents cross-platform navigation issues
 * Ensures mobile users stay on mobile routes and desktop users stay on desktop routes
 */
export function MobileRoutingGuard() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Mobile user trying to access desktop routes
    if (isMobile) {
      const desktopRoutes = ['/dashboard', '/billing', '/inventory', '/patients', '/settings'];
      const isAccessingDesktopRoute = desktopRoutes.some(route => currentPath.startsWith(route));
      
      if (isAccessingDesktopRoute) {
        console.log('Mobile user redirected from desktop route:', currentPath);
        navigate('/', { replace: true });
        return;
      }
    }
    
    // Desktop user trying to access mobile routes
    if (!isMobile) {
      if (currentPath.startsWith('/mobile')) {
        console.log('Desktop user redirected from mobile route:', currentPath);
        navigate('/dashboard', { replace: true });
        return;
      }
    }
  }, [isMobile, location.pathname, navigate]);

  return null;
}
