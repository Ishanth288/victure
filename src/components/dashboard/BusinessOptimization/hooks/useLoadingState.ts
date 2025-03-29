
import { useState, useEffect, useRef } from 'react';

interface UseLoadingStateOptions {
  isLoading: boolean;
  locationLoading: boolean;
  forceExitTimeout?: number;
  stabilityDelay?: number;
}

export function useLoadingState({
  isLoading,
  locationLoading,
  forceExitTimeout = 3000, // Reduced from 5000ms to 3000ms for faster loading
  stabilityDelay = 50 // Reduced from 100ms to 50ms
}: UseLoadingStateOptions) {
  const [isStableLoading, setIsStableLoading] = useState(true);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownLoadingRef = useRef(false);
  
  // Track loading state changes
  const loadingStartTime = useRef<number | null>(null);
  const loadingMetrics = useRef<{totalTime: number, count: number}>({
    totalTime: 0,
    count: 0
  });

  // Add more logging to diagnose loading issues
  useEffect(() => {
    if (isLoading || locationLoading) {
      if (loadingStartTime.current === null) {
        loadingStartTime.current = Date.now();
      }
    } else if (loadingStartTime.current !== null) {
      const loadTime = Date.now() - loadingStartTime.current;
      loadingMetrics.current.totalTime += loadTime;
      loadingMetrics.current.count += 1;
      
      console.log(`Loading completed in ${loadTime}ms. Average: ${
        Math.round(loadingMetrics.current.totalTime / loadingMetrics.current.count)
      }ms over ${loadingMetrics.current.count} loads`);
      
      loadingStartTime.current = null;
    }
  }, [isLoading, locationLoading]);

  // Add stability to the loading state to prevent flickering
  useEffect(() => {
    // When loading starts, set isStableLoading to true immediately
    if (isLoading || locationLoading) {
      setIsStableLoading(true);
      hasShownLoadingRef.current = true;
      
      // Clear any existing timers
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
        stabilityTimerRef.current = null;
      }
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      if (forceExitTimerRef.current) {
        clearTimeout(forceExitTimerRef.current);
      }
      
      // Set a timeout to force exit loading state after a maximum time
      // This prevents infinite loading
      forceExitTimerRef.current = setTimeout(() => {
        console.log("Force exiting loading state after timeout");
        setIsStableLoading(false);
      }, forceExitTimeout);
    } 
    // When loading ends, wait a bit before showing content to prevent flickering
    else if (isStableLoading && hasShownLoadingRef.current) {
      // Clear force exit timer if it exists
      if (forceExitTimerRef.current) {
        clearTimeout(forceExitTimerRef.current);
        forceExitTimerRef.current = null;
      }
      
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      // Allow a little more time for transitions
      stabilityTimerRef.current = setTimeout(() => {
        console.log("Loading completed, transitioning to content display");
        setIsStableLoading(false);
      }, stabilityDelay);
    }

    return () => {
      if (stabilityTimerRef.current) {
        clearTimeout(stabilityTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      if (forceExitTimerRef.current) {
        clearTimeout(forceExitTimerRef.current);
      }
    };
  }, [isLoading, locationLoading, isStableLoading, forceExitTimeout, stabilityDelay]);

  const resetLoading = () => {
    setIsStableLoading(true);
    hasShownLoadingRef.current = true;
    
    // Clear any existing timers
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
      stabilityTimerRef.current = null;
    }
    
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    
    if (forceExitTimerRef.current) {
      clearTimeout(forceExitTimerRef.current);
    }
  };

  return { 
    isStableLoading,
    resetLoading,
    loadingMetrics: loadingMetrics.current
  };
}
