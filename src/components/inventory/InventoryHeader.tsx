
import { m } from "framer-motion";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  onAddClick: () => void;
  onExportClick: () => void;
}

export default function InventoryHeader({ onAddClick, onExportClick }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <m.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-neutral-900"
        >
          Inventory Management
        </m.h1>
        <p className="text-neutral-600 mt-1">
          Manage and track your pharmacy inventory
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" onClick={onExportClick}>
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button className="gap-2" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>
  );
}
