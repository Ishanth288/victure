
import { FloatingIcon } from "@/components/ui/floating-icon";
import { Pill, PencilRuler, Rocket } from "lucide-react";
import { memo, useEffect, useState } from 'react';

// Memoize the component to prevent unnecessary re-renders
export const FloatingIconsSection = memo(() => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  
  useEffect(() => {
    // Check for reduced motion preference or mobile
    setShouldReduceMotion(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      window.innerWidth < 768
    );
  }, []);
  
  // Greatly reduce the number of floating icons for better performance
  return (
    <div className="overflow-hidden -mt-32 relative h-20 md:h-32">
      {!shouldReduceMotion && (
        <>
          <FloatingIcon 
            icon={Pill} 
            color="text-blue-500" 
            size={32} 
            className="top-20 left-[10%]" 
            delay={0.2}
          />
          <FloatingIcon 
            icon={PencilRuler} 
            color="text-indigo-500" 
            size={28} 
            className="top-40 right-[15%]" 
            delay={0.5}
          />
          <FloatingIcon 
            icon={Rocket} 
            color="text-primary" 
            size={24} 
            className="top-30 left-[40%]" 
            delay={0.3}
          />
        </>
      )}
    </div>
  );
});

FloatingIconsSection.displayName = 'FloatingIconsSection';
