
/**
 * Sets up performance optimizations for heavy pages
 * This helps with rendering and data loading
 */
export function setupPageOptimizations() {
  // Use a more efficient approach for performance monitoring
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Increased threshold to reduce console noise
            console.debug(`Long task detected: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      
      return () => observer.disconnect();
    } catch (e) {
      // Silently fail if not supported
      return () => {};
    }
  }
  
  return () => {};
}

/**
 * Optimize scrolling performance
 * Uses passive event listeners and minimal DOM operations
 */
export function optimizeScrolling(scrollContainer: HTMLElement | null): () => void {
  if (!scrollContainer) return () => {};
  
  // Apply GPU acceleration but with minimal CSS changes
  scrollContainer.style.transform = 'translateZ(0)';
  
  // Use passive event listeners only when needed
  const cleanup = () => {
    scrollContainer.style.transform = '';
  };
  
  return cleanup;
}

/**
 * Defers non-critical resources loading
 * @param delay Milliseconds to defer loading
 */
export function deferNonCriticalResources(delay = 2000) {
  setTimeout(() => {
    // Load non-critical CSS
    document.querySelectorAll('link[data-defer="true"]').forEach(link => {
      (link as HTMLLinkElement).media = 'all';
    });
    
    // Load non-critical images
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) img.setAttribute('src', src);
    });
  }, delay);
}
