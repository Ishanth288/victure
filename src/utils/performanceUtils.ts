
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
          if (entry.duration > 100) { // Lower threshold to catch more performance issues
            console.debug(`Long task detected: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask', 'resource', 'navigation', 'paint'] });
      
      return () => observer.disconnect();
    } catch (e) {
      // Silently fail if not supported
      console.warn("PerformanceObserver not supported", e);
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
  const scrollHandler = () => {
    // Using requestAnimationFrame to throttle scroll events
    window.requestAnimationFrame(() => {
      // Optimization: Skip DOM updates if not needed
    });
  };

  // Use passive listeners for better performance
  scrollContainer.addEventListener('scroll', scrollHandler, { passive: true });
  
  // Apply will-change only when needed
  scrollContainer.style.willChange = 'transform';
  
  const cleanup = () => {
    scrollContainer.removeEventListener('scroll', scrollHandler);
    scrollContainer.style.willChange = 'auto';
  };
  
  return cleanup;
}

/**
 * Defers non-critical resources loading
 * @param delay Milliseconds to defer loading
 */
export function deferNonCriticalResources(delay = 300) { // Reduced from 500ms
  // Use requestIdleCallback if available for better timing
  const scheduleDeferred = window.requestIdleCallback || 
    ((cb: () => void) => setTimeout(cb, delay));
  
  scheduleDeferred(() => {
    // Load non-critical CSS
    document.querySelectorAll('link[data-defer="true"]').forEach(link => {
      (link as HTMLLinkElement).media = 'all';
    });
    
    // Load non-critical images
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) img.setAttribute('src', src);
    });
  });
}

/**
 * Optimizes rendering by using IntersectionObserver to only
 * render components when they're visible
 * @param callback Function to run when element is visible
 */
export function createVisibilityObserver(
  callback: (isVisible: boolean, entry?: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
) {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting, entry);
      });
    }, {
      rootMargin: '200px', // Increased from 150px to improve perceived performance
      threshold: 0.01, // Lowered from 0.05 to make loading earlier
      ...options
    });
  }
  
  // Fallback if IntersectionObserver not available
  return {
    observe: (element: Element) => callback(true),
    unobserve: () => {},
    disconnect: () => {}
  };
}

/**
 * Measures component render performance
 * @param componentName Name of the component to measure
 * @returns Object with start and end methods
 */
export function measureRenderPerformance(componentName: string) {
  const markName = `${componentName}_start`;
  const measureName = `${componentName}_render`;
  
  return {
    start: () => {
      if (performance && performance.mark) {
        performance.mark(markName);
      }
    },
    end: () => {
      if (performance && performance.measure) {
        try {
          performance.measure(measureName, markName);
          const entries = performance.getEntriesByName(measureName);
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry && lastEntry.duration > 100) {
            console.warn(`Slow render detected in ${componentName}: ${Math.round(lastEntry.duration)}ms`);
          }
        } catch (e) {
          // Ignore measurement errors
        }
      }
    }
  };
}

/**
 * Creates a debounced version of a function
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait) as unknown as number;
  };
}
