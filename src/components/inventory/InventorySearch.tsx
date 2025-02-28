
import { Search, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface InventorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalItems: number;
  onFilterChange: (type: string) => void;
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
    <Card className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by name, NDC, or manufacturer..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeFilter === "expiringSoon" ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => onFilterChange(activeFilter === "expiringSoon" ? "" : "expiringSoon")}
          >
            <Clock className="h-4 w-4" />
            Expiring Soon
          </Button>
          <Button 
            variant={activeFilter === "lowStock" ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => onFilterChange(activeFilter === "lowStock" ? "" : "lowStock")}
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </Button>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-600">
        Showing {totalItems} items
      </div>
    </Card>
  );
}
