
import { memo, useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingAnimationProps {
  text?: string;
  showLogo?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingAnimation = memo(({ 
  text = "Loading", 
  showLogo = true, 
  size = "md", 
  className = "" 
}: LoadingAnimationProps) => {
  const [dots, setDots] = useState("");
  
  // Creates animated ellipsis effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const getSizeClasses = () => {
    switch(size) {
      case "sm": 
        return "text-base space-y-1";
      case "lg": 
        return "text-2xl space-y-4";
      default: 
        return "text-lg space-y-2";
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4 w-full", 
      getSizeClasses(),
      className
    )}>
      {showLogo ? (
        <div className="flex flex-col items-center space-y-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <span className="text-primary font-bold">
              {size === "lg" ? (
                <span className="text-3xl">Victure</span>
              ) : size === "sm" ? (
                <span className="text-lg">Victure</span>
              ) : (
                <span className="text-2xl">Victure</span>
              )}
            </span>
          </motion.div>
          <motion.div
            animate={{ 
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="relative"
          >
            <Loader 
              className={cn(
                "text-primary",
                size === "lg" ? "h-10 w-10" : size === "sm" ? "h-5 w-5" : "h-7 w-7"
              )} 
            />
          </motion.div>
        </div>
      ) : (
        <motion.div
          animate={{ 
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <Loader 
            className={cn(
              "text-primary",
              size === "lg" ? "h-10 w-10" : size === "sm" ? "h-5 w-5" : "h-7 w-7"
            )} 
          />
        </motion.div>
      )}
      
      {text && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center text-muted-foreground"
        >
          <span>{text}</span>
          <span className="w-6 inline-block">{dots}</span>
        </motion.div>
      )}
    </div>
  );
});

LoadingAnimation.displayName = "LoadingAnimation";
