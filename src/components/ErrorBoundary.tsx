
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
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
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    connectionStatus: 'checking'
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, `ErrorBoundary: ${errorInfo.componentStack}`);
    this.setState({ errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Check if the error might be related to connection issues
    this.checkConnections();
    
    // Send to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag("error_boundary", "true");
      scope.setExtra("componentStack", errorInfo.componentStack);
      Sentry.captureException(error);
    });
  }

  private checkConnections = async () => {
    this.setState({ connectionStatus: 'checking' });
    
    try {
      // Check Supabase connection
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        throw new Error('Supabase connection failed');
      }
      
      this.setState({ connectionStatus: 'connected' });
    } catch (e) {
      console.error('Connection check failed:', e);
      this.setState({ connectionStatus: 'disconnected' });
    }
  }

  private handleRetry = () => {
    // Check connections before resetting error state
    this.checkConnections().then(() => {
      this.setState({ hasError: false });
    });
  }

  private handleReload = () => {
    // Force a full page reload
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const { connectionStatus, error } = this.state;
      
      return (
        <Alert variant="destructive" className="mt-4 mx-2 p-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mt-0.5 mr-2" />
            <div>
              <AlertTitle className="text-lg font-semibold mb-2">Something went wrong</AlertTitle>
              <AlertDescription className="space-y-4">
                <p className="text-base">An error occurred while rendering this component.</p>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md border border-red-200 dark:border-red-800">
                    <p className="text-sm font-mono text-red-800 dark:text-red-300 break-words">
                      {error.toString()}
                    </p>
                  </div>
                )}
                
                {connectionStatus === 'checking' && (
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <p className="text-sm">Checking connection status...</p>
                  </div>
                )}
                
                {connectionStatus === 'disconnected' && (
                  <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">
                      Connection issue detected. Please check your internet connection.
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={this.handleRetry}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={this.handleReload}
                    size="sm"
                  >
                    Reload page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => Sentry.showReportDialog({ eventId: Sentry.lastEventId() })}
                    size="sm"
                  >
                    Report problem
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}
