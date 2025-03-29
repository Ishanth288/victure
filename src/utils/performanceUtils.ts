
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

/**
 * Optimize scrolling performance
 * Applies passive event listeners and CSS optimizations
 */
function optimizeScrolling(): () => void {
  const scrollContainer = document.querySelector('main');
  
  if (scrollContainer) {
    // Apply GPU acceleration and contain properties
    scrollContainer.classList.add('optimize-scroll', 'gpu-accelerated');
    
    // Use passive event listeners to improve scrolling performance
    const handleScroll = () => {
      // Optional: Add any scroll-related performance tracking
      requestAnimationFrame(() => {
        // Minimal scroll optimization logic
        scrollContainer.style.willChange = 'transform';
      });
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.classList.remove('optimize-scroll', 'gpu-accelerated');
      scrollContainer.removeEventListener('scroll', handleScroll);
      scrollContainer.style.willChange = 'auto';
    };
  }
  
  return () => {};
}

/**
 * Optimize animations to reduce performance impact
 */
function optimizeAnimations(): () => void {
  // Reduce animation complexity for smoother performance
  const animatedElements = document.querySelectorAll('.animate-performance-heavy');
  
  animatedElements.forEach(el => {
    el.classList.add('low-impact-animation');
  });
  
  return () => {
    animatedElements.forEach(el => {
      el.classList.remove('low-impact-animation');
    });
  };
}

