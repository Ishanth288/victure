
import React, { useEffect, useRef, useState, memo } from 'react';
import { m } from 'framer-motion';

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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '50px' }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  const getAnimationProps = () => {
    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: isVisible ? { opacity: 1 } : { opacity: 0 },
        };
      case 'slide-up':
        return {
          initial: { opacity: 0, y: 50 },
          animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 },
        };
      case 'slide-right':
        return {
          initial: { opacity: 0, x: -50 },
          animate: isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 },
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
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
});

ScrollReveal.displayName = 'ScrollReveal';
