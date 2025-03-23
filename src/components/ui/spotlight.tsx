
"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  fill?: string;
}

export function Spotlight({
  children,
  className,
  fill = "white",
  ...props
}: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  useEffect(() => {
    if (isMobile) return;
    
    let rafId: number;
    let isMoving = false;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;
      
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Use requestAnimationFrame for smoother performance
      rafId = requestAnimationFrame(() => {
        const div = divRef.current;
        if (!div) return;
        
        const rect = div.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({ x, y });
        
        if (!isMoving) {
          isMoving = true;
          setOpacity(1);
        }
      });
    };

    const handleMouseLeave = () => {
      isMoving = false;
      setOpacity(0);
    };

    const element = divRef.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove, { passive: true });
      element.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isMobile]);

  return (
    <div
      ref={divRef}
      className={cn("h-full w-full overflow-hidden relative", className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-10">
        {!isMobile && (
          <div
            className="h-[50px] w-[50px] rounded-full bg-gradient-to-r from-transparent to-transparent"
            style={{
              position: "absolute",
              opacity,
              top: position.y - 50,
              left: position.x - 50,
              boxShadow: `0 0 120px 80px ${fill}`,
              transition: "opacity 0.2s",
              transform: 'translateZ(0)', // Force GPU acceleration
              willChange: 'opacity, top, left' // Hint to browser for optimization
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}

// Export a memoized version for complex content
export const MemoizedSpotlight = memo(Spotlight);
