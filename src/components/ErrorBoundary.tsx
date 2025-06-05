
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 2; // Reduced max retries

  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error.message);
    
    this.setState({ 
      error, 
      errorInfo,
      retryCount: this.state.retryCount + 1
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
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

    // Add delay for recovery
    this.retryTimeout = setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined
      });
    }, 1000);
  }

  private handleReload = () => {
    // Force a full page reload
    window.location.reload();
  }

  private renderErrorMessage() {
    const { error, retryCount } = this.state;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <Alert className="max-w-lg border-red-200 bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <AlertTitle className="text-red-800 font-semibold">
            Something went wrong
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2 mb-4">
            An unexpected error occurred. Please try refreshing the page.
            
            {retryCount > 0 && (
              <div className="mt-2 text-sm text-red-600">
                Retry attempts: {retryCount}/{this.maxRetries}
              </div>
            )}
          </AlertDescription>
          
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={this.handleRetry}
              variant="default"
              size="sm"
            >
              {retryCount >= this.maxRetries ? (
                "Reload Page"
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
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
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto max-h-32">
                {error.message}
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
