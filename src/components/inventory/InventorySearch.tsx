
import { Search, CircleDashed, AlertCircle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InventorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalItems: number;
  onFilterChange: (filterType: string) => void;
  activeFilter: string | null;
}

export default function InventorySearch({
  searchQuery,
  onSearchChange,
  totalItems,
  onFilterChange,
  activeFilter
}: InventorySearchProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === "lowStock" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("lowStock")}
            className="flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4" />
            <span>Low Stock</span>
          </Button>
          <Button
            variant={activeFilter === "expiringSoon" ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange("expiringSoon")}
            className="flex items-center gap-1"
          >
            <CircleDashed className="h-4 w-4" />
            <span>Expiring Soon</span>
          </Button>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium">{totalItems}</span> items
        </p>
        {activeFilter && (
          <Badge variant="outline" className="flex items-center gap-1">
            <span>
              {activeFilter === "lowStock" ? "Low Stock" : "Expiring Soon"}
            </span>
            <button
              className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
              onClick={() => onFilterChange(activeFilter)}
            >
              ×
            </button>
          </Badge>
        )}
      </div>
    </div>
  );
}
