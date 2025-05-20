
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

export function ButtonSkeleton({ count = 5, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-9 w-full bg-gray-100 dark:bg-gray-800/50 rounded" 
        />
      ))}
    </div>
  );
}

export function TextSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton 
      className={cn("h-5 w-3/4 bg-gray-100 dark:bg-gray-800/50", className)} 
    />
  );
}
