
import { FloatingIcon } from "@/components/ui/floating-icon";
import { Pill, PencilRuler, Rocket, Database, CloudCog, Cpu, BrainCircuit, Microscope } from "lucide-react";
import { memo, useEffect, useState } from "react";

export const FloatingIconsSection = memo(() => {
  const [isMounted, setIsMounted] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add resize listener
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Avoid rendering these elements during SSR to prevent hydration issues
  if (!isMounted) {
    return <div className="h-20"></div>;
  }
  
  return (
    <div className="overflow-hidden -mt-32 relative h-[180px] md:h-[300px]">
      <FloatingIcon 
        icon={Pill} 
        color="text-blue-500" 
        size={isSmallScreen ? 24 : 32} 
        className="top-20 left-[10%]" 
        delay={0.2}
      />
      <FloatingIcon 
        icon={PencilRuler} 
        color="text-indigo-500" 
        size={isSmallScreen ? 22 : 28} 
        className="top-40 right-[15%]" 
        delay={0.5}
      />
      <FloatingIcon 
        icon={Rocket} 
        color="text-primary" 
        size={isSmallScreen ? 20 : 24} 
        className="top-80 left-[25%]" 
        delay={0.8}
      />
      <FloatingIcon 
        icon={BrainCircuit} 
        color="text-secondary" 
        size={isSmallScreen ? 22 : 26} 
        className="top-30 right-[25%]" 
        delay={0.3}
      />
      <FloatingIcon 
        icon={Microscope} 
        color="text-primary-dark" 
        size={isSmallScreen ? 24 : 30} 
        className="top-60 left-[40%]" 
        delay={0.7}
      />
    </div>
  );
});

FloatingIconsSection.displayName = 'FloatingIconsSection';
