
import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  animation?: 'fade' | 'slide-up' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
  disabled?: boolean;
}

export function ScrollReveal({ 
  children, 
  className = '',
  threshold = 0.1,
  animation = 'fade',
  delay = 0,
  duration = 0.3,
  disabled = false
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Skip animation if explicitly disabled
    if (disabled) {
      setIsVisible(true);
      return;
    }
    
    // Use a lightweight version of the animation on mobile 
    const isMobile = window.innerWidth <= 768;
    const shouldReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    // Skip animation entirely for reduced motion preference
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }
    
    let observer: IntersectionObserver;
    const currentRef = ref.current;
    
    // Only create observer if needed and if browser supports it
    if (currentRef && !isVisible && 'IntersectionObserver' in window) {
      // Use a more performant intersection observer configuration
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Use requestAnimationFrame for smoother animations
            requestAnimationFrame(() => {
              setIsVisible(true);
            });
            observer.unobserve(entries[0].target);
          }
        },
        {
          threshold: isMobile ? 0.01 : threshold, // Lower threshold on mobile
          rootMargin: "0px 0px 100px 0px" // Start animations a bit earlier
        }
      );
      
      observer.observe(currentRef);
    }

    return () => {
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, disabled]);

  // If animations are disabled, just render children
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const getAnimationProps = () => {
    // Reduce animation complexity on mobile
    const isMobile = window.innerWidth <= 768;
    const animationScale = isMobile ? 0.5 : 1; // Smaller animations on mobile
    
    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: isVisible ? { opacity: 1 } : { opacity: 0 },
        };
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 25 * animationScale },
          animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 * animationScale },
        };
      case 'slide-right':
        return {
          initial: { opacity: 0, x: -25 * animationScale },
          animate: isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -25 * animationScale },
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
  };

  return (
    <m.div
      ref={ref}
      className={className}
      {...getAnimationProps()}
      transition={{ 
        duration, 
        delay, 
        ease: 'easeOut',
        // Add these properties for better performance with framer-motion
        type: "tween"
      }}
      style={{ 
        willChange: "transform, opacity",
        backfaceVisibility: "hidden", // Reduce composite layers
        WebkitFontSmoothing: "subpixel-antialiased", // Better text rendering
      }}
    >
      {children}
    </m.div>
  );
}
