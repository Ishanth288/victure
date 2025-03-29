
import { Loader2 } from "lucide-react";

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

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 max-w-lg text-center">
        <span className="text-red-500 text-xl font-bold block mb-2">Unable to load data</span>
        <p className="text-red-800 mb-4">
          There was a problem connecting to the database. This might be due to a network issue.
        </p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
}
