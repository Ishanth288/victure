
import { memo } from "react";

interface LoadingPlaceholderProps {
  height?: string;
}

export const LoadingPlaceholder = memo(({ height = "h-60" }: LoadingPlaceholderProps) => (
  <div className={`${height} bg-neutral-50 flex items-center justify-center`}>
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-8 w-24 bg-neutral-200 rounded mb-4"></div>
      <div className="h-4 w-64 bg-neutral-200 rounded"></div>
    </div>
  </div>
));

LoadingPlaceholder.displayName = 'LoadingPlaceholder';
