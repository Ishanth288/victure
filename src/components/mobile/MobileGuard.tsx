
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    // Only log the current state, don't redirect automatically
    console.log(`MobileGuard: isMobile=${isMobile}, currentPath=${location.pathname}`);
  }, [isMobile, location.pathname]);

  // Just render children without any redirects
  return <>{children}</>;
}
