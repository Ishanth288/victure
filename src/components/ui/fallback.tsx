
import React from 'react';
import { LoadingAnimation } from './loading-animation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FallbackProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Fallback({ 
  message = "Loading...", 
  className = "",
  size = "md" 
}: FallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <LoadingAnimation text={message} size={size} />
    </div>
  );
}

interface ErrorFallbackProps extends FallbackProps {
  onRetry?: () => void;
  error?: Error | string;
  retryText?: string;
}

export function ErrorFallback({ 
  message = "Something went wrong", 
  className = "",
  size = "md",
  onRetry,
  error,
  retryText = "Retry"
}: ErrorFallbackProps) {
  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.message 
      ? error.message 
      : message;
      
  return (
    <div className={cn(
      `flex flex-col items-center justify-center p-8 rounded-lg border`,
      error ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800' : '',
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
        <AlertCircle className="text-red-500 h-6 w-6" />
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 mb-3 text-center max-w-md">{errorMessage}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          className="mt-2 gap-2 hover:bg-red-50 dark:hover:bg-red-900/30"
          size="sm"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {retryText}
        </Button>
      )}
    </div>
  );
}

export function TableSkeleton({ 
  rows = 4, 
  columns = 4,
  className = ""
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-t-md mb-2"></div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`skeleton-row-${rowIndex}`} 
          className="flex space-x-2 mb-2"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`skeleton-cell-${rowIndex}-${colIndex}`}
              className="h-12 bg-gray-100 dark:bg-gray-800/50 rounded flex-1"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}
