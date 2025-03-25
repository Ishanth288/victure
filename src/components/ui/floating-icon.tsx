
import React from 'react';
import { m } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FloatingIconProps {
  icon: LucideIcon;
  color?: string;
  size?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FloatingIcon({ 
  icon: Icon, 
  color = "text-primary", 
  size = 24, 
  delay = 0,
  duration = 3,
  className
}: FloatingIconProps) {
  return (
    <m.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 5, 0, -5, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay,
      }}
    >
      <Icon className={`${color}`} size={size} />
    </m.div>
  );
}
