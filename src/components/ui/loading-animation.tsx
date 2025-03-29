
import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingAnimationProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  logoText?: string;
  showLogo?: boolean;
}

export function LoadingAnimation({ 
  text = "Loading...", 
  size = "md", 
  className = "",
  logoText = "Victure",
  showLogo = true
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: "h-12 gap-2",
    md: "h-20 gap-3",
    lg: "h-32 gap-4"
  };
  
  const iconSize = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  
  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl"
  };

  const logoSize = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4", 
      sizeClasses[size],
      className
    )}>
      {showLogo && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className={cn(
            "font-bold animate-pulse text-primary", 
            logoSize[size]
          )}>
            {logoText}
          </h3>
          <Loader2 className={cn(
            "animate-spin text-primary", 
            iconSize[size]
          )} />
        </div>
      )}
      {text && (
        <p className={cn(
          "text-gray-500", 
          textSize[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}
