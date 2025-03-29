
import { useEffect } from 'react';
import { setupPageOptimizations } from "@/utils/performanceUtils";
import { initializeAppMonitoring } from "@/utils/supabaseMonitoring";

export function useAppMonitoring() {
  // Initialize app monitoring on first load
  useEffect(() => {
    console.log("Initializing app monitoring");
    initializeAppMonitoring();
  }, []);

  // Apply performance optimizations
  useEffect(() => {
    console.log("Setting up page optimizations");
    const cleanup = setupPageOptimizations();
    return () => cleanup();
  }, []);
}
