
import { memo } from "react";

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
  animate = true
}: LoadingPlaceholderProps) => {
  // Using CSS will-change to optimize the animation performance
  const animationClass = animate ? "animate-pulse will-change-opacity" : "";
  
  return (
    <div className={`${height} ${width} ${bgColor} flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className={`${pulseHeight} ${pulseWidth} ${pulseColor} rounded mb-4 ${animationClass}`}></div>
        <div className={`h-4 w-64 ${pulseColor} rounded ${animationClass}`}></div>
        {message && (
          <p className="mt-4 text-neutral-600">{message}</p>
        )}
      </div>
    </div>
  );
});

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
