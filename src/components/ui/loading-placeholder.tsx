import { memo } from "react";
import { LoadingAnimation } from "./loading-animation";

interface LoadingPlaceholderProps {
  height?: string;
  width?: string;
  bgColor?: string;
  pulseColor?: string;
  pulseWidth?: string;
  pulseHeight?: string;
  message?: string;
  className?: string;
  animate?: boolean;
  showLogo?: boolean;
}

export const LoadingPlaceholder = memo(({ 
  height = "h-60",
  width = "w-full",
  bgColor = "bg-neutral-50",
  pulseColor = "bg-neutral-200",
  pulseWidth = "w-24",
  pulseHeight = "h-8",
  message,
  className = "",
  animate = true,
  showLogo = true
}: LoadingPlaceholderProps) => {
  // If we want to show our new loading animation
  if (animate) {
    return (
      <div className={`${height} ${width} ${bgColor} flex items-center justify-center ${className}`}>
        <LoadingAnimation text={message} showLogo={showLogo} />
      </div>
    );
  }
  
  // Legacy loading placeholder - keeping for compatibility
  return (
    <div className={`${height} ${width} ${bgColor} flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div 
          className={`${pulseHeight} ${pulseWidth} ${pulseColor} rounded mb-4 animate-pulse will-change-opacity`}
          style={{ contain: 'layout style paint' }}  
        ></div>
        <div 
          className={`h-4 w-64 ${pulseColor} rounded animate-pulse will-change-opacity`}
          style={{ contain: 'layout style paint' }}
        ></div>
        {message && (
          <p className="mt-4 text-neutral-600">{message}</p>
        )}
      </div>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
