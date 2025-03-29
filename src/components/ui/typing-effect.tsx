
import React, { useState, useEffect, useRef } from 'react';

interface TypingEffectProps {
  text: string[];
  className?: string;
  speed?: number;
  delay?: number;
}

export function TypingEffect({ 
  text, 
  className,
  speed = 50,
  delay = 1500
}: TypingEffectProps) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add visibility transition to prevent flickering
  useEffect(() => {
    // Wait for a small delay before making the component visible
    stabilityTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(true);
      }
    }, 100);
    
    // Set up cleanup function
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current || !isVisible) return;
    
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      
      if (!isDeleting) {
        // Typing
        const targetText = text[currentIndex];
        if (currentText.length < targetText.length) {
          setCurrentText(targetText.substring(0, currentText.length + 1));
        } else {
          // Done typing, wait before deleting
          timeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              setIsDeleting(true);
            }
          }, delay);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1));
        } else {
          // Done deleting, move to next text
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % text.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentText, currentIndex, isDeleting, text, speed, delay, isVisible]);

  if (!isVisible) {
    return <div className={className} aria-hidden="true"></div>;
  }

  return (
    <div className={`${className} transition-opacity duration-300 ease-in-out`}>
      <span>{currentText}</span>
      <span className="inline-block w-0.5 h-5 ml-1 bg-neutral-800 animate-blink"></span>
    </div>
  );
}
