
import React from 'react';
import { m } from 'framer-motion';

interface AnimatedGradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
}

export function AnimatedGradientBorder({ 
  children, 
  className = "",
  borderWidth = 2 
}: AnimatedGradientBorderProps) {
  return (
    <div className={`relative ${className}`}>
      <m.div 
        className="absolute inset-0 rounded-xl z-0 overflow-hidden"
        style={{ padding: borderWidth }}
        animate={{ 
          background: [
            'linear-gradient(90deg, #0D9488, #F97316, #0F766E, #FB923C)',
            'linear-gradient(180deg, #0D9488, #F97316, #0F766E, #FB923C)',
            'linear-gradient(270deg, #0D9488, #F97316, #0F766E, #FB923C)',
            'linear-gradient(360deg, #0D9488, #F97316, #0F766E, #FB923C)',
            'linear-gradient(90deg, #0D9488, #F97316, #0F766E, #FB923C)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-full w-full absolute" />
      </m.div>
      <div className="relative rounded-xl h-full z-10 bg-card">
        {children}
      </div>
    </div>
  );
}
