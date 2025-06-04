import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLoadingStateOptions {
  isLoading: boolean;
  locationLoading: boolean;
  forceExitTimeout?: number;
  stabilityDelay?: number;
}

export function useLoadingState({
  isLoading,
  locationLoading,
  forceExitTimeout = 3000,
  stabilityDelay = 50
}: UseLoadingStateOptions) {
  const [isStableLoading, setIsStableLoading] = useState(true);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceExitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownLoadingRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Track loading state changes
  const loadingStartTime = useRef<number | null>(null);
  const loadingMetrics = useRef<{totalTime: number, count: number}>({
    totalTime: 0,
    count: 0
  });

  // Cleanup function to clear all timers
  const clearAllTimers = useCallback(() => {
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
      stabilityTimerRef.current = null;
    }
    if (forceExitTimerRef.current) {
      clearTimeout(forceExitTimerRef.current);
      forceExitTimerRef.current = null;
    }
  }, []);

  // Safely update state only if component is mounted
  const safeSetIsStableLoading = useCallback((value: boolean) => {
    if (mountedRef.current) {
      setIsStableLoading(value);
    }
  }, []);

  // Track loading metrics
  useEffect(() => {
    const anyLoading = isLoading || locationLoading;
    
    if (anyLoading) {
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

  // Main loading state management
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const anyLoading = isLoading || locationLoading;
    
    if (anyLoading) {
      // Clear any existing timers to prevent conflicts
      clearAllTimers();
      
      // Immediately set loading state
      safeSetIsStableLoading(true);
      hasShownLoadingRef.current = true;
      
      // Set force exit timer as fallback
      forceExitTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log("Force exiting loading state after timeout");
          safeSetIsStableLoading(false);
        }
      }, forceExitTimeout);
      
    } else if (hasShownLoadingRef.current) {
      // Loading has ended, transition out with stability delay
      clearAllTimers();
      
      stabilityTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.log("Loading completed, transitioning to content display");
          safeSetIsStableLoading(false);
        }
      }, stabilityDelay);
    }
    
    // No cleanup needed here since clearAllTimers handles it
  }, [isLoading, locationLoading, forceExitTimeout, stabilityDelay, clearAllTimers, safeSetIsStableLoading]);

  // Reset loading function
  const resetLoading = useCallback(() => {
    if (!mountedRef.current) return;
    
    clearAllTimers();
    safeSetIsStableLoading(true);
    hasShownLoadingRef.current = true;
  }, [clearAllTimers, safeSetIsStableLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return { 
    isStableLoading: mountedRef.current ? isStableLoading : true,
    resetLoading,
    loadingMetrics: loadingMetrics.current
  };
}
