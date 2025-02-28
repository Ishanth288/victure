
import { Search, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface InventorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalItems: number;
}

export default function InventorySearch({ searchQuery, onSearchChange, totalItems }: InventorySearchProps) {
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
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            Expiring Soon
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
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
