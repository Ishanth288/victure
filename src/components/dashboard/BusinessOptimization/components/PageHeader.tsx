
import { MapPin, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  pharmacyLocation: any;
  onRefresh: () => void;
}

export function PageHeader({ pharmacyLocation, onRefresh }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Business Optimization</h1>
        {pharmacyLocation && (
          <div className="flex items-center mt-1 text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" />
            <span>
              {pharmacyLocation.city}, {pharmacyLocation.state} - Location-based analytics enabled
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All Data
        </button>
      </div>
    </div>
  );
}
