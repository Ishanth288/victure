
import React, { useEffect, useRef, useState, memo } from 'react';
import { m } from 'framer-motion';
import * as Sentry from "@sentry/react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  animation?: 'fade' | 'slide-up' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
}

export const ScrollReveal = memo(({ 
  children, 
  className = '',
  threshold = 0.2,
  animation = 'fade',
  delay = 0,
  duration = 0.5
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    // Create a Sentry span to track performance
    const span = Sentry.startInactiveSpan({
      name: "scroll-reveal-observer",
      op: "ui.interaction",
    });

    // Use more performant IntersectionObserver with better settings
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Add small delay to stagger animations when multiple items appear at once
            requestAnimationFrame(() => {
              setIsVisible(true);
              
              // Add breadcrumb for debugging
              Sentry.addBreadcrumb({
                category: 'ui.animation',
                message: `Element became visible with animation: ${animation}`,
                level: 'info',
              });
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold, 
        rootMargin: '50px',
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      // End the span when component unmounts
      span.end();
    };
  }, [threshold, animation]);

  // Pre-compute animation properties to avoid work during scrolling
  const animationProps = (() => {
    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: isVisible ? { opacity: 1 } : { opacity: 0 },
        };
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 30 },
          animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
        };
      case 'slide-right':
        return {
          initial: { opacity: 0, x: -30 },
          animate: isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 },
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: isVisible ? { opacity: 1 } : { opacity: 0 },
        };
    }
  })();

  return (
    <m.div
      ref={ref}
      className={className}
      {...animationProps}
      transition={{ 
        duration, 
        delay, 
        ease: 'easeOut' 
      }}
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
      }}
    >
      {children}
    </m.div>
  );
});

ScrollReveal.displayName = 'ScrollReveal';
