
"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

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
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (!isEnabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;
      const div = divRef.current;
      const rect = div.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPosition({ x, y });
      setOpacity(1);
    };

    const handleMouseLeave = () => {
      setOpacity(0);
    };

    const element = divRef.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isEnabled]);

  useEffect(() => {
    // Disable spotlight on mobile
    setIsEnabled(window.innerWidth > 768);
    const handleResize = () => {
      setIsEnabled(window.innerWidth > 768);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className={cn("h-full w-full overflow-hidden", className)}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-10">
        <div
          className="h-[50px] w-[50px] rounded-full bg-gradient-to-r from-transparent to-transparent"
          style={{
            position: "absolute",
            opacity,
            top: position.y - 50,
            left: position.x - 50,
            boxShadow: `0 0 120px 80px ${fill}`,
            transition: "opacity 0.2s",
          }}
        />
      </div>
      {children}
    </div>
  );
}
