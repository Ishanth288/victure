
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
  const scrollHandler = (e: Event) => {
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
export function deferNonCriticalResources(delay = 1500) {
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
export function createVisibilityObserver(callback: (isVisible: boolean) => void) {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting);
      });
    }, {
      rootMargin: '100px', // Load slightly before visible
      threshold: 0.1 // Trigger when 10% visible
    });
  }
  
  // Fallback if IntersectionObserver not available
  return {
    observe: () => callback(true),
    unobserve: () => {},
    disconnect: () => {}
  };
}
