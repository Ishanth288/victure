
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectionManager } from "@/utils/connectionManager";
import { toast } from "@/hooks/use-toast";
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryDelay?: number;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  connectionStatus: 'checking' | 'connected' | 'disconnected' | 'reconnecting';
  retryCount: number;
  retryTimer?: number;
}

export class ConnectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    connectionStatus: 'connected',
    retryCount: 0
  };

  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if error is likely a connection error
    const isConnectionError = error.message.includes('network') || 
      error.message.includes('connection') || 
      error.message.includes('offline') ||
      error.message.includes('timeout') ||
      error.message.includes('failed to fetch');
    
    return { 
      hasError: true, 
      error,
      connectionStatus: isConnectionError ? 'disconnected' : 'connected'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Connection error boundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Check if the error might be related to connection issues
    this.checkConnection();
    
    // Send to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setTag("connection_error_boundary", "true");
      scope.setExtra("componentStack", errorInfo.componentStack);
      scope.setExtra("connectionStatus", this.state.connectionStatus);
      Sentry.captureException(error);
    });

    // Start auto-retry if connection error
    if (this.isLikelyConnectionError(error)) {
      this.scheduleRetry();
    }
  }

  private isLikelyConnectionError(error: Error): boolean {
    const errorMessage = String(error).toLowerCase();
    return errorMessage.includes('network') || 
      errorMessage.includes('connection') || 
      errorMessage.includes('offline') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('failed to fetch');
  }

  private scheduleRetry = () => {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
    
    const { retryDelay = 3000, maxRetries = 5 } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount < maxRetries) {
      this.setState({ 
        connectionStatus: 'reconnecting', 
        retryCount: retryCount + 1,
        retryTimer: maxRetries - retryCount
      });
      
      // Use exponential backoff for retries
      const delay = retryDelay * Math.pow(1.5, retryCount);
      
      this.reconnectTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, delay);
    } else {
      toast({
        title: "Connection failed",
        description: "Maximum retry attempts reached. Please reload the page manually.",
        variant: "destructive",
        duration: 0 // Don't auto dismiss this toast
      });
    }
  }

  private checkConnection = async () => {
    this.setState({ connectionStatus: 'checking' });
    
    try {
      const isConnected = await connectionManager.checkConnection();
      
      this.setState({ 
        connectionStatus: isConnected ? 'connected' : 'disconnected'
      });
      
      if (!isConnected) {
        this.scheduleRetry();
      }
    } catch (e) {
      this.setState({ connectionStatus: 'disconnected' });
      this.scheduleRetry();
    }
  }

  private handleRetry = () => {
    // Check connection before resetting error state
    connectionManager.checkConnection().then(isConnected => {
      if (isConnected) {
        this.setState({ 
          hasError: false, 
          connectionStatus: 'connected',
          retryCount: 0
        });
        
        toast({
          title: "Connection restored",
          description: "Successfully reconnected to the application",
          variant: "success"
        });
      } else {
        this.scheduleRetry();
      }
    });
  }

  private handleManualRetry = () => {
    this.setState({ 
      connectionStatus: 'checking',
      retryCount: 0
    });
    this.handleRetry();
  }

  private handleReload = () => {
    // Force a full page reload
    window.location.reload();
  }

  componentWillUnmount() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const { connectionStatus, error, retryCount, retryTimer } = this.state;
      
      return (
        <Alert className="mt-4 mx-2 p-6 bg-background border-2 shadow-lg">
          <div className="flex items-start">
            {connectionStatus === 'disconnected' ? (
              <WifiOff className="h-5 w-5 mt-0.5 mr-2 text-amber-500" />
            ) : connectionStatus === 'reconnecting' ? (
              <RefreshCw className="h-5 w-5 mt-0.5 mr-2 text-amber-500 animate-spin" />
            ) : (
              <Wifi className="h-5 w-5 mt-0.5 mr-2 text-green-500" />
            )}
            <div className="flex-1">
              <AlertTitle className="text-lg font-semibold mb-2">
                {connectionStatus === 'disconnected' ? 'Connection lost' : 
                 connectionStatus === 'reconnecting' ? `Reconnecting (Attempt ${retryCount})` : 
                 'Connection issue'}
              </AlertTitle>
              <AlertDescription className="space-y-4">
                <p className="text-base">
                  {connectionStatus === 'disconnected' ? 
                    'We\'re having trouble connecting to the server. This could be due to network issues or the server might be temporarily unavailable.' :
                   connectionStatus === 'reconnecting' ? 
                    `Attempting to reconnect automatically in ${retryTimer} seconds...` :
                    'There was a problem with your connection. Please try again.'}
                </p>
                
                {error && connectionStatus !== 'reconnecting' && (
                  <div className="bg-background/50 p-2 rounded-md border text-xs font-mono text-muted-foreground overflow-auto max-h-24">
                    {error.toString()}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant={connectionStatus === 'reconnecting' ? "outline" : "default"} 
                    onClick={this.handleManualRetry}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} />
                    {connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Try again now'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={this.handleReload}
                    size="sm"
                  >
                    Reload page
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
