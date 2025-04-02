
import { ArrowUpRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MouseEventHandler } from "react";

interface PageHeaderProps {
  pharmacyLocation: { state: string; city: string } | null;
  onRefresh: MouseEventHandler<HTMLButtonElement> | (() => void);  // Updated to accept both types
  lastRefreshed: Date;
  dataSources?: string[];
  hasError?: boolean;
  isRefreshing?: boolean;
}

export function PageHeader({ 
  pharmacyLocation, 
  onRefresh, 
  lastRefreshed,
  dataSources,
  hasError,
  isRefreshing = false
}: PageHeaderProps) {
  const formattedLastRefreshed = formatDistanceToNow(lastRefreshed, { addSuffix: true });
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Optimization</h1>
        <p className="text-muted-foreground">
          {pharmacyLocation ? (
            `Analytics for ${pharmacyLocation.city}, ${pharmacyLocation.state}`
          ) : (
            <Skeleton className="h-4 w-36" />
          )}
        </p>
        {dataSources && dataSources.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Data sources: </span>
            <div className="flex flex-wrap gap-1">
              {dataSources.map((source, index) => (
                <span key={source} className="text-xs bg-muted px-1.5 py-0.5 rounded-md flex items-center">
                  {source}
                  {index < dataSources.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 md:mt-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          Updated {formattedLastRefreshed}
        </span>
        <Button 
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
        {hasError && !isRefreshing && (
          <Button 
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
            onClick={onRefresh}
          >
            <span>Try Again</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
