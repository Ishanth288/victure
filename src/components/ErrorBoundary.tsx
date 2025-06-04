import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, AlertTriangle, Database, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/utils/errorHandling";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  connectionStatus: 'checking' | 'connected' | 'disconnected';
  errorType: 'supabase' | 'inventory' | 'billing' | 'subscription' | 'loading' | 'unknown';
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    connectionStatus: 'checking',
    errorType: 'unknown',
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const errorType = ErrorBoundary.categorizeError(error);
    return { 
      hasError: true, 
      error,
      errorType
    };
  }

  private static categorizeError(error: Error): State['errorType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('supabase') || message.includes('postgrest')) {
      return 'supabase';
    }
    if (message.includes('inventory') || message.includes('bill_items')) {
      return 'inventory';
    }
    if (message.includes('billing') || message.includes('bill')) {
      return 'billing';
    }
    if (message.includes('subscribe') || message.includes('channel')) {
      return 'subscription';
    }
    if (message.includes('loading') || message.includes('timeout')) {
      return 'loading';
    }
    
    return 'unknown';
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Log to our error handling system
    logError(error, "ErrorBoundary");
    
    // Log to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag("component", "ErrorBoundary");
      scope.setTag("errorType", this.state.errorType);
      scope.setContext("errorInfo", {
        componentStack: errorInfo.componentStack
      });
      Sentry.captureException(error);
    });

    this.setState({ 
      error, 
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check connections
    this.checkConnections();
  }

  private checkConnections = async () => {
    this.setState({ connectionStatus: 'checking' });
    
    try {
      // Check Supabase connection with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      const connectionPromise = supabase.from('profiles').select('id').limit(1);
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      this.setState({ connectionStatus: 'connected' });
    } catch (e) {
      console.error('Connection check failed:', e);
      this.setState({ connectionStatus: 'disconnected' });
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      this.handleReload();
      return;
    }

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Check connections before resetting error state
    this.checkConnections().then(() => {
      // Add delay for recovery
      this.retryTimeout = setTimeout(() => {
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined,
          retryCount: this.state.retryCount + 1
        });
      }, 1000);
    });
  }

  private handleReload = () => {
    // Force a full page reload
    window.location.reload();
  }

  private renderErrorMessage() {
    const { error, errorType, connectionStatus } = this.state;
    
    const errorMessages = {
      supabase: "Database connection error. Please check your internet connection and try again.",
      inventory: "Inventory system error. This might be due to data synchronization issues.",
      billing: "Billing system error. Please ensure all data is valid and try again.",
      subscription: "Real-time updates error. The page will still work but updates may be delayed.",
      loading: "Loading timeout error. The page took too long to load.",
      unknown: "An unexpected error occurred. Please try refreshing the page."
    };

    const errorIcons = {
      supabase: Database,
      inventory: AlertTriangle,
      billing: AlertCircle,
      subscription: WifiOff,
      loading: RefreshCw,
      unknown: AlertCircle
    };

    const ErrorIcon = errorIcons[errorType];
    const message = errorMessages[errorType];

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <Alert className="max-w-lg border-red-200 bg-red-50">
          <ErrorIcon className="h-6 w-6 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">
            {errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2 mb-4">
            {message}
            
            {connectionStatus === 'disconnected' && (
              <div className="mt-2 text-sm text-red-600">
                Connection Status: Disconnected
              </div>
            )}
            
            {this.state.retryCount > 0 && (
              <div className="mt-2 text-sm text-red-600">
                Retry attempts: {this.state.retryCount}/{this.maxRetries}
              </div>
            )}
          </AlertDescription>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={this.handleRetry}
              variant="default"
              size="sm"
              disabled={this.state.connectionStatus === 'checking'}
            >
              {this.state.connectionStatus === 'checking' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : this.state.retryCount >= this.maxRetries ? (
                "Reload Page"
              ) : (
                "Try Again"
              )}
            </Button>
            
            <Button 
              onClick={this.handleReload}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-red-600">Error Details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto">
                {error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </Alert>
      </div>
    );
  }

  public componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return this.renderErrorMessage();
    }

    return this.props.children;
  }
}
