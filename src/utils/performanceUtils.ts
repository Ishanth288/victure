
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
  
  // Apply scroll optimizations
  const scrollCleanup = optimizeScrolling();
  
  // Apply animation optimizations
  const animationCleanup = optimizeAnimations();
  
  // Use Intersection Observer to lazy load components as they come into view
  const elementsToLazyLoad = document.querySelectorAll('.lazy-load');
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.classList.add('loaded');
        lazyLoadObserver.unobserve(target);
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '100px' 
  });
  
  elementsToLazyLoad.forEach(el => {
    lazyLoadObserver.observe(el);
  });

  return () => {
    try {
      observer.disconnect();
      scrollCleanup();
      animationCleanup();
      lazyLoadObserver.disconnect();
    } catch (e) {
      console.warn('Error disconnecting performance observers:', e);
    }
  };
}
