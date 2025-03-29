
import { Loader2, AlertCircle, WifiOff, Database, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading business optimization data..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
  errorType?: 'connection' | 'database' | 'server' | 'unknown';
  errorMessage?: string;
}

export function ErrorState({ 
  onRetry, 
  errorType = 'unknown',
  errorMessage
}: ErrorStateProps) {
  // Select the appropriate icon based on error type
  const ErrorIcon = {
    'connection': WifiOff,
    'database': Database,
    'server': ServerCrash,
    'unknown': AlertCircle
  }[errorType];

  // Select the appropriate title based on error type
  const errorTitle = {
    'connection': "Connection Error",
    'database': "Database Error",
    'server': "Server Error",
    'unknown': "Unable to load data"
  }[errorType];

  // Select appropriate message based on error type
  const defaultMessage = {
    'connection': "We're having trouble connecting to the server. Please check your internet connection and try again.",
    'database': "There was a problem loading data from the database. This might be a temporary issue.",
    'server': "Our servers are currently experiencing issues. Our team has been notified.",
    'unknown': "There was a problem loading your business optimization data. This might be due to a network issue or server error."
  }[errorType];

  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="p-6 rounded-lg border border-red-200 bg-red-50 max-w-lg text-center">
        <div className="flex justify-center mb-3">
          <ErrorIcon className="h-10 w-10 text-red-500" />
        </div>
        <span className="text-red-600 text-xl font-bold block mb-2">{errorTitle}</span>
        <p className="text-red-800 mb-4">
          {errorMessage || defaultMessage}
        </p>
        <div className="space-y-2">
          <Button 
            onClick={onRetry}
            className="w-full bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry Loading
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="p-6 rounded-lg border border-muted max-w-lg text-center">
        <div className="flex justify-center mb-3">
          <Database className="h-10 w-10 text-muted-foreground" />
        </div>
        <span className="text-lg font-medium block mb-2">No optimization data available</span>
        <p className="text-muted-foreground mb-4">
          We don't have enough data yet to provide business optimization insights.
          Continue using the system to generate analytics data.
        </p>
      </div>
    </div>
  );
}
