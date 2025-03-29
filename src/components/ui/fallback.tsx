
import React from 'react';
import { LoadingAnimation } from './loading-animation';
import { Loader2 } from 'lucide-react';

interface FallbackProps {
  message?: string;
  className?: string;
}

export function Fallback({ message = "Loading...", className = "" }: FallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <LoadingAnimation text={message} />
    </div>
  );
}

export function ErrorFallback({ message = "Something went wrong", className = "" }: FallbackProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
        <span className="text-red-500 text-2xl">!</span>
      </div>
      <p className="text-sm text-red-600 mb-2">{message}</p>
      <button 
        onClick={() => window.location.reload()}
        className="text-xs text-white bg-red-500 hover:bg-red-600 rounded px-3 py-1"
      >
        Retry
      </button>
    </div>
  );
}
