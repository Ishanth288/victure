/**
 * Connection Error Boundary for handling Supabase connection issues
 * Provides specific fallbacks for connection timeouts and network errors
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, Wifi, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { supabaseCircuitBreaker, isCircuitHealthy, getCircuitStatus } from '../../utils/circuitBreaker';
import { CURRENT_CONFIG } from '../../utils/performanceConfig';
import { checkSupabaseConnection } from '../../utils/supabaseErrorHandling';

interface ConnectionErrorBoundaryState {
  hasConnectionError: boolean;
  hasGeneralError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime?: number;
  connectionStatus?: 'checking' | 'connected' | 'disconnected' | 'circuit-open';
}

interface ConnectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number;
  showCircuitStatus?: boolean;
}

export class ConnectionErrorBoundary extends Component<
  ConnectionErrorBoundaryProps,
  ConnectionErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout;
  private statusCheckInterval?: NodeJS.Timeout;

  constructor(props: ConnectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasConnectionError: false,
      hasGeneralError: false,
      isRetrying: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ConnectionErrorBoundaryState> {
    const isConnectionError = 
      error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('Circuit breaker') ||
      error.name === 'AbortError' ||
      error.name === 'TimeoutError';

    if (isConnectionError) {
      return {
        hasConnectionError: true,
        hasGeneralError: false,
        error
      };
    }

    return {
      hasConnectionError: false,
      hasGeneralError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    if (CURRENT_CONFIG.enableVerboseLogging) {
      console.error('ConnectionErrorBoundary caught an error:', error, errorInfo);
    }
    
    this.props.onError?.(error, errorInfo);
    
    // Start monitoring connection status if it's a connection error
    if (this.state.hasConnectionError) {
      this.startConnectionMonitoring();
    }
  }

  componentWillUnmount() {
    this.clearTimeouts();
  }

  private clearTimeouts() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  private startConnectionMonitoring() {
    this.checkConnectionStatus();
    
    // Check connection status every 10 seconds
    this.statusCheckInterval = setInterval(() => {
      this.checkConnectionStatus();
    }, 10000);
  }

  private async checkConnectionStatus() {
    try {
      this.setState({ connectionStatus: 'checking' });
      
      if (!isCircuitHealthy(supabaseCircuitBreaker)) {
        this.setState({ connectionStatus: 'circuit-open' });
        return;
      }
      
      const isConnected = await checkSupabaseConnection();
      this.setState({ 
        connectionStatus: isConnected ? 'connected' : 'disconnected' 
      });
      
      // Auto-retry if connection is restored
      if (isConnected && this.state.hasConnectionError) {
        this.handleRetry();
      }
    } catch (error) {
      this.setState({ connectionStatus: 'disconnected' });
    }
  }

  private handleRetry = async () => {
    const { maxRetries = 3, retryDelay = 2000 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('Max retries reached for connection error boundary');
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1,
      lastRetryTime: Date.now()
    });

    try {
      // Check if circuit breaker allows the retry
      if (!isCircuitHealthy(supabaseCircuitBreaker)) {
        throw new Error('Circuit breaker is open');
      }

      // Wait for retry delay
      await new Promise(resolve => {
        this.retryTimeoutId = setTimeout(resolve, retryDelay);
      });

      // Reset error state to trigger re-render
      this.setState({
        hasConnectionError: false,
        hasGeneralError: false,
        error: undefined,
        errorInfo: undefined,
        isRetrying: false,
        connectionStatus: 'connected'
      });
      
      this.clearTimeouts();
      
    } catch (error) {
      this.setState({ 
        isRetrying: false,
        connectionStatus: 'disconnected'
      });
      console.error('Retry failed:', error);
    }
  };

  private handleReset = () => {
    this.setState({
      hasConnectionError: false,
      hasGeneralError: false,
      error: undefined,
      errorInfo: undefined,
      isRetrying: false,
      retryCount: 0,
      lastRetryTime: undefined,
      connectionStatus: undefined
    });
    this.clearTimeouts();
  };

  private handleCircuitReset = () => {
    supabaseCircuitBreaker.reset();
    this.handleRetry();
  };

  private getErrorMessage(): string {
    const { error } = this.state;
    if (!error) return 'An unknown error occurred';
    
    if (error.message.includes('timeout')) {
      return 'Connection timeout - the server is taking too long to respond';
    }
    if (error.message.includes('Circuit breaker')) {
      return 'Service temporarily unavailable - too many failed requests';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error - please check your internet connection';
    }
    
    return error.message;
  }

  private renderConnectionStatus() {
    const { connectionStatus } = this.state;
    const { showCircuitStatus = true } = this.props;
    
    if (!showCircuitStatus) return null;
    
    const circuitStatus = getCircuitStatus();
    
    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wifi className="h-4 w-4" />
          <span>Connection Status:</span>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' :
            connectionStatus === 'checking' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {connectionStatus === 'checking' ? 'Checking...' :
             connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'circuit-open' ? 'Circuit Open' :
             'Disconnected'}
          </span>
        </div>
        
        {circuitStatus && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            <span>Circuit:</span>
            <span className={`font-medium ${
              circuitStatus.supabase.state === 'CLOSED' ? 'text-green-600' :
              circuitStatus.supabase.state === 'HALF_OPEN' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {circuitStatus.supabase.state}
            </span>
            <span className="text-xs">
              ({circuitStatus.supabase.failureCount} failures)
            </span>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { children, fallback } = this.props;
    const { 
      hasConnectionError, 
      hasGeneralError, 
      isRetrying, 
      retryCount,
      connectionStatus 
    } = this.state;

    if (hasConnectionError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Connection Problem</CardTitle>
              <CardDescription>
                {this.getErrorMessage()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  We're having trouble connecting to our servers. This might be due to:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Slow internet connection</li>
                    <li>Server maintenance</li>
                    <li>Temporary network issues</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {this.renderConnectionStatus()}

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleRetry}
                  disabled={isRetrying || connectionStatus === 'circuit-open'}
                  className="w-full"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again {retryCount > 0 && `(${retryCount}/3)`}
                    </>
                  )}
                </Button>
                
                {connectionStatus === 'circuit-open' && (
                  <Button 
                    onClick={this.handleCircuitReset}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Circuit Breaker
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Dismiss
                </Button>
              </div>
              
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  If the problem persists, please check your internet connection or try again later.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (hasGeneralError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred while loading this section.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button onClick={this.handleReset} className="w-full">
                Try Again
              </Button>
              
              {CURRENT_CONFIG.enableVerboseLogging && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping components with connection error boundary
export function withConnectionErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ConnectionErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ConnectionErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ConnectionErrorBoundary>
    );
  };
}

// Hook for using connection error boundary context
export function useConnectionErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  
  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
}