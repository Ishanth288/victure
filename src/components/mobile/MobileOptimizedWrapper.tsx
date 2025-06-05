import React, { Component, ReactNode, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { isMobileDevice, mobileOptimizer } from '@/utils/mobileOptimizer';
import { hapticFeedback } from '@/utils/mobileUtils';

interface MobileOptimizedWrapperProps {
  children: ReactNode;
  loadingText?: string;
  errorFallback?: ReactNode;
  enableHaptics?: boolean;
  showConnectionStatus?: boolean;
}

interface MobileLoadingState {
  isLoading: boolean;
  progress: number;
  status: string;
}

// Simple connection status hook
function useConnectionStatus(): boolean {
  const [isConnected, setIsConnected] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isConnected;
}

// Enhanced Error Boundary for Mobile
class MobileErrorBoundary extends Component<
  { 
    children: ReactNode; 
    fallback?: ReactNode; 
    onError?: (error: Error) => void;
  }, 
  { 
    hasError: boolean; 
    error: Error | null; 
    retryCount: number;
  }
> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Mobile Error Boundary:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error);
    }

    // Haptic feedback for error
    if (isMobileDevice()) {
      hapticFeedback('error').catch(console.warn);
    }

    // Auto-retry for network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      this.scheduleRetry();
    }
  }

  scheduleRetry = () => {
    if (this.state.retryCount < 3) {
      const delay = Math.pow(2, this.state.retryCount) * 1000; // 1s, 2s, 4s
      
      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          retryCount: prev.retryCount + 1
        }));
      }, delay);
    }
  };

  handleManualRetry = async () => {
    if (isMobileDevice()) {
      await hapticFeedback('light');
    }
    
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0
    });
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-sm border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-sm text-red-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              <div className="space-y-2">
                <Button 
                  onClick={this.handleManualRetry}
                  className="w-full"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                  size="sm"
                >
                  Refresh Page
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 mt-3">
                  Retry attempts: {this.state.retryCount}/3
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Loading Component for Mobile
function MobileLoadingScreen({ 
  loadingText = "Loading...", 
  progress, 
  status 
}: { 
  loadingText?: string; 
  progress?: number; 
  status?: string; 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-green-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <span className="text-white text-2xl font-bold">V</span>
        </div>

        {/* Loading Spinner */}
        <div className="relative mb-4">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin mx-auto" />
          {progress !== undefined && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading Text */}
        <h2 className="text-lg font-semibold text-teal-800 mb-2 mt-6">
          {loadingText}
        </h2>
        
        {status && (
          <p className="text-sm text-teal-600 animate-pulse">
            {status}
          </p>
        )}

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Connection Status Indicator for Mobile
function MobileConnectionIndicator() {
  const isConnected = useConnectionStatus();
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`
        px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2 shadow-lg transition-all duration-300
        ${isConnected 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white animate-pulse'
        }
      `}>
        {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>{isConnected ? 'Connected' : 'No Connection'}</span>
      </div>
    </div>
  );
}

// Main Mobile Optimized Wrapper
export function MobileOptimizedWrapper({
  children,
  loadingText = "Loading...",
  errorFallback,
  enableHaptics = true,
  showConnectionStatus = true
}: MobileOptimizedWrapperProps) {
  const [loadingState, setLoadingState] = useState<MobileLoadingState>({
    isLoading: true,
    progress: 0,
    status: 'Initializing...'
  });

  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    const initializeMobileOptimizations = async () => {
      if (!isMobileDevice()) {
        setLoadingState({ isLoading: false, progress: 100, status: 'Ready' });
        return;
      }

      try {
        // Phase 1: Initialize mobile optimizer
        setLoadingState({ isLoading: true, progress: 20, status: 'Optimizing for mobile...' });
        
        const cleanup = mobileOptimizer.initialize({
          enableTouchOptimizations: true,
          enableScrollOptimizations: true,
          enableBatteryOptimizations: true,
          reducedMotion: false
        });

        // Phase 2: Setup performance monitoring
        setLoadingState({ isLoading: true, progress: 40, status: 'Setting up performance monitoring...' });
        
        // Add mobile-specific performance observers
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('mobile-optimized');
              }
            });
          });

          // Observe all main content elements
          setTimeout(() => {
            document.querySelectorAll('main, .mobile-content').forEach(el => {
              observer.observe(el);
            });
          }, 100);
        }

        // Phase 3: Setup haptic feedback
        if (enableHaptics) {
          setLoadingState({ isLoading: true, progress: 60, status: 'Enabling haptic feedback...' });
          
          // Test haptic feedback
          try {
            await hapticFeedback('light');
          } catch (error) {
            console.log('Haptic feedback not available');
          }
        }

        // Phase 4: Finalize optimization
        setLoadingState({ isLoading: true, progress: 80, status: 'Finalizing optimizations...' });
        
        // Add mobile-specific CSS optimizations
        const style = document.createElement('style');
        style.innerHTML = `
          .mobile-optimized {
            transform: translateZ(0);
            will-change: transform;
            backface-visibility: hidden;
          }
          
          .mobile-content {
            touch-action: manipulation;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Fix iOS safari viewport issues */
          .mobile-viewport-fix {
            min-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
          }
          
          /* Improve touch targets */
          .mobile-touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimize scrolling performance */
          .mobile-scroll-container {
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        `;
        document.head.appendChild(style);

        // Phase 5: Complete
        setLoadingState({ isLoading: true, progress: 100, status: 'Ready!' });
        
        // Brief delay to show completion
        setTimeout(() => {
          setLoadingState({ isLoading: false, progress: 100, status: 'Ready' });
          setIsOptimized(true);
        }, 500);

        // Return cleanup function
        return cleanup;
      } catch (error) {
        console.error('Mobile optimization failed:', error);
        setLoadingState({ isLoading: false, progress: 100, status: 'Error' });
        return () => {}; // Return empty cleanup function on error
      }
    };

    let cleanupFunction: (() => void) | undefined;

    initializeMobileOptimizations().then((cleanup) => {
      cleanupFunction = cleanup;
    });

    return () => {
      if (cleanupFunction && typeof cleanupFunction === 'function') {
        cleanupFunction();
      }
    };
  }, [enableHaptics]);

  // Handle error reporting
  const handleError = async (error: Error) => {
    console.error('Mobile app error:', error);
    
    if (enableHaptics && isMobileDevice()) {
      await hapticFeedback('error');
    }
  };

  if (loadingState.isLoading) {
    return (
      <MobileLoadingScreen 
        loadingText={loadingText}
        progress={loadingState.progress}
        status={loadingState.status}
      />
    );
  }

  return (
    <MobileErrorBoundary 
      fallback={errorFallback}
      onError={handleError}
    >
      <div className="mobile-content mobile-viewport-fix">
        {showConnectionStatus && <MobileConnectionIndicator />}
        {children}
      </div>
    </MobileErrorBoundary>
  );
}

// Hook for mobile-specific optimizations
export function useMobileOptimizations() {
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionDelay: 0
  });

  useEffect(() => {
    if (!isMobileDevice()) return;

    const startTime = performance.now();
    
    // Measure performance metrics
    const measurePerformance = () => {
      const loadTime = performance.now() - startTime;
      const renderTime = performance.timing?.loadEventEnd - performance.timing?.loadEventStart || 0;
      
      setPerformanceMetrics({
        loadTime,
        renderTime,
        interactionDelay: 0 // Will be updated on first interaction
      });
    };

    // Measure first interaction delay
    let firstInteraction = true;
    const measureInteraction = () => {
      if (firstInteraction) {
        const interactionTime = performance.now() - startTime;
        setPerformanceMetrics(prev => ({
          ...prev,
          interactionDelay: interactionTime
        }));
        firstInteraction = false;
      }
    };

    // Add interaction listeners
    document.addEventListener('touchstart', measureInteraction, { once: true, passive: true });
    document.addEventListener('click', measureInteraction, { once: true, passive: true });

    // Measure performance after load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    setIsOptimized(true);

    return () => {
      document.removeEventListener('touchstart', measureInteraction);
      document.removeEventListener('click', measureInteraction);
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  return { isOptimized, performanceMetrics };
}
