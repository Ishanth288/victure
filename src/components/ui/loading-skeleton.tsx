
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

export function PharmacyNameSkeleton() {
  return (
    <div className="flex animate-pulse">
      <Skeleton className="h-7 w-32 bg-gray-100 dark:bg-gray-800/50 rounded" />
    </div>
  );
}

export function NavItemSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-4 w-4 rounded-full bg-gray-100 dark:bg-gray-800/50" />
          <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-gray-800/50 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CompanyLogoSkeleton() {
  return (
    <div className="flex justify-center animate-pulse">
      <Skeleton className="h-8 w-64 bg-gray-100 dark:bg-gray-800/50 rounded" />
    </div>
  );
}
