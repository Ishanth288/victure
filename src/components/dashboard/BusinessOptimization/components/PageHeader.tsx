
import { Skeleton } from "@/components/ui/skeleton";

export interface PageHeaderProps {
  title: string;
  description: string;
  isLoading: boolean;
  hasError: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  isLoading, 
  hasError 
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
          {hasError && (
            <div className="mt-2 text-sm text-red-500">
              There was an error loading data. Please try again later.
            </div>
          )}
        </>
      )}
    </div>
  );
}
