/**
 * Mobile Performance Optimizer
 * Handles mobile-specific optimizations for better performance and battery life
 */

interface MobileOptimizationConfig {
  enableTouchOptimizations?: boolean;
  enableScrollOptimizations?: boolean;
  enableBatteryOptimizations?: boolean;
  reducedMotion?: boolean;
}

class MobileOptimizer {
  private isOptimized: boolean = false;
  private touchStartTime: number = 0;
  private lastScrollTime: number = 0;
  private scrollTimeout: NodeJS.Timeout | null = null;
  private rafId: number | null = null;

  /**
   * Initialize mobile optimizations
   */
  public initialize(config: MobileOptimizationConfig = {}): () => void {
    if (this.isOptimized) {
      console.warn('Mobile optimizer already initialized');
      return () => {};
    }

    const {
      enableTouchOptimizations = true,
      enableScrollOptimizations = true,
      enableBatteryOptimizations = true,
      reducedMotion = false
    } = config;

    console.log('🔧 Initializing mobile optimizations');

    const cleanupFunctions: (() => void)[] = [];

    // Touch optimizations
    if (enableTouchOptimizations) {
      cleanupFunctions.push(this.setupTouchOptimizations());
    }

    // Scroll optimizations
    if (enableScrollOptimizations) {
      cleanupFunctions.push(this.setupScrollOptimizations());
    }

    // Battery optimizations
    if (enableBatteryOptimizations) {
      cleanupFunctions.push(this.setupBatteryOptimizations());
    }

    // Reduced motion support
    if (reducedMotion || this.prefersReducedMotion()) {
      cleanupFunctions.push(this.setupReducedMotion());
    }

    // Viewport optimizations
    cleanupFunctions.push(this.setupViewportOptimizations());

    this.isOptimized = true;

    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
      this.isOptimized = false;
      console.log('🧹 Mobile optimizations cleaned up');
    };
  }

  /**
   * Setup touch optimizations for better responsiveness
   */
  private setupTouchOptimizations(): () => void {
    const handleTouchStart = (e: TouchEvent) => {
      this.touchStartTime = performance.now();
      
      // Add active state for immediate visual feedback
      const target = e.target as HTMLElement;
      if (target && target.classList) {
        target.classList.add('touch-active');
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList) {
        // Remove active state after a short delay for visual feedback
        setTimeout(() => {
          target.classList.remove('touch-active');
        }, 150);
      }

      // Log slow touch responses
      const touchDuration = performance.now() - this.touchStartTime;
      if (touchDuration > 100) {
        console.warn(`Slow touch response: ${touchDuration}ms`);
      }
    };

    // Add passive listeners for better scroll performance
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Prevent default touch behaviors that cause delays
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    document.addEventListener('touchstart', preventDefaultTouch);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchstart', preventDefaultTouch);
    };
  }

  /**
   * Setup scroll optimizations
   */
  private setupScrollOptimizations(): () => void {
    const handleScroll = () => {
      const now = performance.now();
      this.lastScrollTime = now;

      // Clear existing timeout
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      // Cancel previous RAF
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }

      // Use RAF for smooth scroll handling
      this.rafId = requestAnimationFrame(() => {
        // Add scrolling class for CSS optimizations
        document.body.classList.add('is-scrolling');
      });

      // Remove scrolling class after scroll ends
      this.scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150);
    };

    // Use passive listeners for better performance
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Apply CSS optimizations
    const style = document.createElement('style');
    style.innerHTML = `
      .is-scrolling * {
        pointer-events: none !important;
      }
      
      .touch-active {
        transform: scale(0.98);
        transition: transform 0.1s ease;
      }
      
      @supports (overscroll-behavior: none) {
        body {
          overscroll-behavior: none;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('scroll', handleScroll);
      document.head.removeChild(style);
      
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
    };
  }

  /**
   * Setup battery optimization
   */
  private setupBatteryOptimizations(): () => void {
    let isPageVisible = true;
    let animationsPaused = false;

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      
      if (!isPageVisible && !animationsPaused) {
        // Pause animations when page is hidden
        document.body.style.setProperty('--animation-play-state', 'paused');
        animationsPaused = true;
        console.log('⏸️ Animations paused for battery saving');
      } else if (isPageVisible && animationsPaused) {
        // Resume animations when page is visible
        document.body.style.setProperty('--animation-play-state', 'running');
        animationsPaused = false;
        console.log('▶️ Animations resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Detect battery level if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const handleBatteryLow = () => {
          if (battery.level < 0.2) {
            document.body.classList.add('battery-saving-mode');
            console.log('🔋 Battery saving mode activated');
          } else {
            document.body.classList.remove('battery-saving-mode');
          }
        };

        battery.addEventListener('levelchange', handleBatteryLow);
        handleBatteryLow(); // Check initial level
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.classList.remove('battery-saving-mode');
    };
  }

  /**
   * Setup reduced motion support
   */
  private setupReducedMotion(): () => void {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      .battery-saving-mode * {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);

    document.body.classList.add('reduced-motion');

    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('reduced-motion');
    };
  }

  /**
   * Setup viewport optimizations
   */
  private setupViewportOptimizations(): () => void {
    // Ensure proper viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    const originalContent = viewportMeta.content;
    viewportMeta.content = 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Handle orientation changes
    const handleOrientationChange = () => {
      // Force a repaint to fix iOS Safari issues
      setTimeout(() => {
        const currentHeight = window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${currentHeight * 0.01}px`);
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Set initial viewport height
    handleOrientationChange();

    return () => {
      viewportMeta.content = originalContent;
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }

  /**
   * Check if user prefers reduced motion
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Get current optimization status
   */
  public getStatus(): { isOptimized: boolean; metrics: any } {
    return {
      isOptimized: this.isOptimized,
      metrics: {
        lastScrollTime: this.lastScrollTime,
        prefersReducedMotion: this.prefersReducedMotion(),
        isVisible: !document.hidden
      }
    };
  }
}

// Export singleton instance
export const mobileOptimizer = new MobileOptimizer();

// Helper function to detect mobile devices
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

// Auto-initialize for mobile devices
export function autoInitializeMobileOptimizations(): () => void {
  if (isMobileDevice()) {
    console.log('📱 Mobile device detected, initializing optimizations');
    return mobileOptimizer.initialize();
  }
  
  return () => {};
} 