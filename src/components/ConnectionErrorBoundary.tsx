
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    // Only log, don't do complex error handling
    console.warn("Connection error caught:", error.message);
  }

  private handleReload = () => {
    window.location.reload();
  }

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Alert className="mt-4 mx-2 p-6">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Connection Issue</AlertTitle>
          <AlertDescription className="mt-2 mb-4">
            There was a problem with your connection. Please try again.
          </AlertDescription>
          
          <div className="flex gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="default"
              size="sm"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={this.handleReload}
              variant="outline"
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}
