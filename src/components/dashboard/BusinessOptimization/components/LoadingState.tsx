
import { memo } from "react";
import { Loader2, Database, WifiOff, ServerCrash, AlertCircle } from "lucide-react";
import { TypingEffect } from "@/components/ui/typing-effect";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = memo(({ message = "Loading data..." }: LoadingStateProps) => {
  const loadingMessages = [
    "Analyzing regional health trends...",
    "Processing market insights...",
    "Gathering information from Google Trends...",
    "Optimizing your business metrics...",
    message
  ];

  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-6 transition-opacity duration-300 ease-in-out">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
        <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8 w-[90vw] max-w-md flex flex-col items-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold text-center mb-2">Loading Business Analytics</h3>
          <div className="h-12 text-center text-muted-foreground">
            <TypingEffect text={loadingMessages} speed={40} delay={1800} />
          </div>
        </div>
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

interface ErrorStateProps {
  onRetry: () => void;
  errorType?: 'connection' | 'database' | 'server' | 'unknown';
  errorMessage?: string;
}

export const ErrorState = memo(({ 
  onRetry, 
  errorType = 'unknown',
  errorMessage 
}: ErrorStateProps) => {
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
});

export const EmptyState = memo(() => {
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
});
