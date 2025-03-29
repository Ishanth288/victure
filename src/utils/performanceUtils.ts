// Utility functions for performance optimization
// These functions help improve the performance of the application

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced version of the function.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Throttle function to limit the rate at which a function can fire.
 * @param func The function to throttle.
 * @param limit The time limit in milliseconds.
 * @returns A throttled version of the function.
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Optimize image loading by lazy loading images that are not in the viewport.
 * @param images An array of HTMLImageElements to lazy load.
 */
export function lazyLoadImages(images: HTMLImageElement[]): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target as HTMLImageElement;
        image.src = image.dataset.src || "";
        observer.unobserve(image);
      }
    });
  });

  images.forEach(image => {
    observer.observe(image);
  });
}

/**
 * Sets up performance optimizations for heavy pages
 * This helps with rendering and data loading
 */
export function setupPageOptimizations() {
  // Register performance observer to track long tasks
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        console.warn(`Long task detected: ${entry.name} took ${entry.duration}ms`);
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('PerformanceObserver for longtasks not supported in this browser');
  }
  
  // Enable route-based code splitting and prefetching
  // Only load scripts needed for the current page
  // This is handled by the framework, but we can add custom prefetching

  return () => {
    try {
      observer.disconnect();
    } catch (e) {
      console.warn('Error disconnecting performance observer:', e);
    }
  };
}

/**
 * Function to measure the performance of a given function.
 * @param fn The function to measure.
 * @param args The arguments to pass to the function.
 * @returns The result of the function and the time it took to execute.
 */
export async function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): Promise<{ result: ReturnType<T>; duration: number }> {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  const duration = end - start;
  console.log(`Function ${fn.name} took ${duration}ms to execute.`);
  return { result, duration };
}
