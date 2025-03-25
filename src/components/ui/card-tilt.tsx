
import React, { useState, useCallback, memo } from 'react';
import { m } from 'framer-motion';

interface CardTiltProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTilt = memo(function CardTilt({ children, className }: CardTiltProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  // Check if we should disable animations for better performance
  const shouldDisableEffects = window.innerWidth < 768 || 
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Memoize the handler to prevent unnecessary re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldDisableEffects) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Reduce the tilt effect for better performance
    const rotateXValue = ((y - centerY) / centerY) * -5; // Reduced from -10 to -5
    const rotateYValue = ((x - centerX) / centerX) * 5; // Reduced from 10 to 5
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  }, [shouldDisableEffects]);

  const handleMouseLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
  }, []);

  // If effects are disabled, render a simpler version
  if (shouldDisableEffects) {
    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`}>
        {children}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    );
  }

  return (
    <m.div
      className={`relative overflow-hidden rounded-xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
        willChange: 'transform', // Optimize for animations
        backfaceVisibility: 'hidden' // Reduce composite layers
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: '0 10px 15px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      {children}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </m.div>
  );
});

export { CardTilt };
