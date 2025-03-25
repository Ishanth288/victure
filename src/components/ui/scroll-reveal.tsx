
import React, { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  animation?: 'fade' | 'slide-up' | 'slide-right' | 'scale';
  delay?: number;
  duration?: number;
}

export function ScrollReveal({ 
  children, 
  className = '',
  threshold = 0.2,
  animation = 'fade',
  delay = 0,
  duration = 0.5
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Use a lightweight version of the animation on mobile 
    const isMobile = window.innerWidth <= 768;
    const shouldReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    
    // Skip animation entirely for reduced motion preference
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }
    
    // Use a more performant intersection observer configuration
    const observerOptions = {
      threshold: isMobile ? 0.05 : threshold, // Lower threshold on mobile
      rootMargin: "0px 0px 100px 0px" // Start animations a bit earlier
    };
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Use requestAnimationFrame for smoother animations
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
          observer.unobserve(entry.target);
        }
      },
      observerOptions
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

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
        type: "tween",
        willChange: "transform, opacity" 
      }}
      style={{ 
        willChange: "transform, opacity",
        backfaceVisibility: "hidden", // Reduce composite layers
        WebkitFontSmoothing: "subpixel-antialiased", // Better text rendering
        perspective: 1000
      }}
    >
      {children}
    </m.div>
  );
}
