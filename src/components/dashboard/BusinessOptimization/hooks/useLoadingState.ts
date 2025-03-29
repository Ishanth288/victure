
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
  forceExitTimeout = 8000,
  stabilityDelay = 500
}: UseLoadingStateOptions) {
  const [isStableLoading, setIsStableLoading] = useState(true);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const forceExitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add stability to the loading state to prevent flickering
  useEffect(() => {
    // When loading starts, set isStableLoading to true immediately
    if (isLoading || locationLoading) {
      setIsStableLoading(true);
      
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
    else if (isStableLoading) {
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

  return { isStableLoading };
}
