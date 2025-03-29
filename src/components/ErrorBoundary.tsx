
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError, checkSupabaseConnection } from "@/utils/supabaseErrorHandling";
import * as Sentry from "@sentry/react";

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
  }

  private checkConnections = async () => {
    this.setState({ connectionStatus: 'checking' });
    const isConnected = await checkSupabaseConnection();
    this.setState({ 
      connectionStatus: isConnected ? 'connected' : 'disconnected' 
    });
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
      
      const { connectionStatus } = this.state;
      
      return (
        <Alert variant="destructive" className="mt-4 mx-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            <p className="mb-2">An error occurred while rendering this component.</p>
            {connectionStatus === 'checking' && (
              <p className="text-sm mb-2">Checking connection status...</p>
            )}
            {connectionStatus === 'disconnected' && (
              <p className="text-sm mb-2">
                Connection issue detected. Please check your internet connection.
              </p>
            )}
            <div className="flex space-x-2 mt-2">
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
              >
                Try again
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleReload}
              >
                Reload page
              </Button>
              <Button 
                variant="outline" 
                onClick={() => Sentry.showReportDialog({ eventId: Sentry.lastEventId() })}
              >
                Report problem
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
