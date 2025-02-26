
import { Button } from "@/components/ui/button";

interface InventoryPaginationProps {
  totalItems: number;
}

export default function InventoryPagination({ totalItems }: InventoryPaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-neutral-600">
        Showing {totalItems} of {totalItems} items
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      </div>
    </div>
  );
}
