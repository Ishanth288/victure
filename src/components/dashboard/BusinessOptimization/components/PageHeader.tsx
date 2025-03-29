
import { RefreshCcw, Home, MapPin, Database, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PageHeaderProps {
  pharmacyLocation: any;
  onRefresh: () => void;
  lastRefreshed?: Date;
  dataSources?: string[];
  hasError?: boolean;
}

export function PageHeader({ 
  pharmacyLocation, 
  onRefresh, 
  lastRefreshed, 
  dataSources,
  hasError 
}: PageHeaderProps) {
  const formatRefreshTime = (date?: Date) => {
    if (!date) return "Never";
    
    // Format the date
    return new Date(date).toLocaleString('en-US', {
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1">Business Optimization</h1>
        <p className="text-muted-foreground text-sm">
          Data-driven insights to optimize your pharmacy business
        </p>
        {lastRefreshed && (
          <div className="text-xs text-muted-foreground mt-1">
            Last refreshed: {formatRefreshTime(lastRefreshed)}
          </div>
        )}
        {dataSources && dataSources.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Data sources: {dataSources.join(', ')}
            </span>
          </div>
        )}
        {hasError && (
          <div className="flex items-center gap-1 mt-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs">
              Using offline data - online sources currently unavailable
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        {pharmacyLocation && (pharmacyLocation.city || pharmacyLocation.state) && (
          <Card className="bg-muted/50">
            <CardContent className="py-2 px-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {[
                  pharmacyLocation.city,
                  pharmacyLocation.state
                ].filter(Boolean).join(", ")}
              </span>
            </CardContent>
          </Card>
        )}
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                <span>Refresh</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manually refresh all data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
