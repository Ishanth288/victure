
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
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
}

export class ConnectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Connection error boundary caught error:", error, errorInfo);
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined,
      errorInfo: undefined
    });
  }

  private handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      const { error } = this.state;
      
      return (
        <Alert className="mt-4 mx-2 p-6 bg-background border-2 shadow-lg">
          <div className="flex items-start">
            <WifiOff className="h-5 w-5 mt-0.5 mr-2 text-amber-500" />
            <div className="flex-1">
              <AlertTitle className="text-lg font-semibold mb-2">
                Connection Issue
              </AlertTitle>
              <AlertDescription className="space-y-4">
                <p className="text-base">
                  We're having trouble connecting to the server. This could be due to network issues.
                </p>
                
                {error && (
                  <div className="bg-background/50 p-2 rounded-md border text-xs font-mono text-muted-foreground overflow-auto max-h-24">
                    {error.toString()}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button 
                    variant="default" 
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
