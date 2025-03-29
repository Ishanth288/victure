
/**
 * Utility functions for performance optimization
 */

/**
 * Checks if hover is supported on the current device
 */
export const isHoverSupported = (): boolean => {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: hover)').matches;
};

/**
 * Determines if animations should be reduced based on device capabilities
 */
export const shouldReduceAnimation = (): boolean => {
  return typeof window !== 'undefined' && (window.innerWidth < 768 || !isHoverSupported());
};

/**
 * Sets up performance optimizations for the page
 * @returns A cleanup function to remove listeners and classes
 */
export const setupPageOptimizations = (): (() => void) => {
  if (typeof document === 'undefined') return () => {};
  
  // Add passive scroll listener
  document.addEventListener('scroll', () => {}, { passive: true });

  // Only perform these optimizations if animations shouldn't be reduced
  if (!shouldReduceAnimation()) {
    // Add preconnect for Spline
    const linkEl = document.createElement('link');
    linkEl.rel = 'preconnect';
    linkEl.href = 'https://prod.spline.design';
    document.head.appendChild(linkEl);

    // Preload important assets
    const preloadLinks = [
      { href: '/og-image.png', as: 'image' }
    ];
    
    preloadLinks.forEach(link => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.href = link.href;
      preloadLink.as = link.as;
      document.head.appendChild(preloadLink);
    });

    // Add GPU acceleration class
    document.documentElement.classList.add('gpu-accelerated');
  }

  // Return cleanup function
  return () => {
    document.removeEventListener('scroll', () => {});
    document.documentElement.classList.remove('gpu-accelerated');
  };
};
