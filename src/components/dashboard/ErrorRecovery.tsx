import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Dashboard Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      errorInfo,
    });

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry after a delay for certain errors
    this.scheduleAutoRetry(error);
  }

  private scheduleAutoRetry = (error: Error) => {
    const { retryCount } = this.state;
    const maxRetries = 3;
    
    // Only auto-retry for network or loading errors
    const isRetryableError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('loading') ||
      error.message.includes('timeout');

    if (retryCount < maxRetries && isRetryableError) {
      const retryDelay = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s, 8s
      
      console.log(`🔄 Auto-retry scheduled in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, retryDelay);
    }
  };

  private handleRetry = () => {
    console.log('🔄 Dashboard Error Boundary: Attempting retry');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  };

  private handleManualRetry = () => {
    console.log('🔄 Dashboard Error Boundary: Manual retry triggered');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0, // Reset retry count for manual retries
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, lastErrorTime } = this.state;
      
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const errorAge = Date.now() - lastErrorTime;
      const isRecentError = errorAge < 30000; // Less than 30 seconds ago

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="w-full max-w-lg border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Dashboard Error
                {isRecentError && (
                  <Badge variant="destructive" className="ml-2">
                    Recent
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  An error occurred while loading the dashboard. This might be due to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Network connectivity issues</li>
                  <li>Database connection problems</li>
                  <li>Temporary server overload</li>
                  <li>Browser compatibility issues</li>
                </ul>
              </div>

              {error && (
                <details className="text-xs bg-gray-100 p-2 rounded">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <div className="mt-2 space-y-1">
                    <div><strong>Error:</strong> {error.message}</div>
                    <div><strong>Type:</strong> {error.name}</div>
                    {retryCount > 0 && (
                      <div><strong>Retry Attempts:</strong> {retryCount}</div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleManualRetry}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2 border-t">
                <p className="flex items-center justify-center">
                  <Bug className="h-3 w-3 mr-1" />
                  Error ID: {lastErrorTime.toString(36)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple functional error fallback component
export function DashboardErrorFallback({ 
  error, 
  retry 
}: { 
  error: Error; 
  retry: () => void; 
}) {
  return (
    <div className="text-center p-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Dashboard Temporarily Unavailable
      </h3>
      <p className="text-gray-600 mb-4">
        We're experiencing some technical difficulties. Please try again.
      </p>
      <Button onClick={retry} size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// Hook for programmatic error reporting
export function useErrorReporting() {
  const reportError = (error: Error, context?: string) => {
    console.error(`🚨 Error reported from ${context || 'unknown context'}:`, error);
    
    // Could integrate with error reporting service here
    // Sentry.captureException(error, { tags: { context } });
  };

  return { reportError };
} 