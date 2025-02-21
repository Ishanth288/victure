
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { type InventoryItem } from "@/types/inventory";

interface InventoryTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onToggleItem: (id: number) => void;
  onEditItem: (item: InventoryItem) => void;
}

export default function InventoryTable({
  items,
  selectedItems,
  onToggleItem,
  onEditItem
}: InventoryTableProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock":
        return "bg-green-100 text-green-800";
      case "low stock":
        return "bg-yellow-100 text-yellow-800";
      case "out of stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExpiryColor = (date: string) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const monthsDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 1) return "text-red-500";
    if (monthsDiff <= 3) return "text-yellow-500";
    return "text-neutral-600";
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <Checkbox />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <span>Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th className="px-4 py-3 text-left">NDC</th>
              <th className="px-4 py-3 text-left">Manufacturer</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Unit Cost</th>
              <th className="px-4 py-3 text-left">Expiry Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {items.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-neutral-200 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => onToggleItem(item.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.ndc}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.manufacturer}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">${item.unitCost.toFixed(2)}</td>
                  <td className={`px-4 py-3 ${getExpiryColor(item.expiryDate)}`}>
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onEditItem(item)}
                    >
                      Edit
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
