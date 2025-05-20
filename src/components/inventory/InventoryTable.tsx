
import { m, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type InventoryItem } from "@/types/inventory";

interface InventoryTableProps {
  items: InventoryItem[];
  selectedItems: number[];
  onToggleItem: (id: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: number) => void;
}

export default function InventoryTable({
  items,
  selectedItems,
  onToggleItem,
  onEditItem,
  onDeleteItem
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

  const getExpiryColor = (date: string | null) => {
    if (!date) return "text-neutral-600";
    const expiryDate = new Date(date);
    const today = new Date();
    const monthsDiff = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff <= 1) return "text-red-500";
    if (monthsDiff <= 3) return "text-yellow-500";
    return "text-neutral-600";
  };

  // Calculate profit margin for an item
  const calculateProfitMargin = (item: InventoryItem) => {
    if (!item.selling_price) return "N/A";
    
    const profit = item.selling_price - item.unit_cost;
    const margin = (profit / item.selling_price) * 100;
    
    return margin.toFixed(2) + "%";
  };

  console.log("Rendering InventoryTable with", items?.length || 0, "items");

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-50 border-b border-neutral-200">
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <span>Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>NDC</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost Price (₹)</TableHead>
              <TableHead>Selling Price (₹)</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!items || items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="px-4 py-6 text-center text-gray-500">
                  No inventory items found. Add an item to get started.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-neutral-200 hover:bg-neutral-50"
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-neutral-600">{item.ndc || "N/A"}</TableCell>
                    <TableCell className="text-neutral-600">{item.manufacturer || "N/A"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.unit_cost.toFixed(2)}</TableCell>
                    <TableCell>₹{item.selling_price ? item.selling_price.toFixed(2) : "N/A"}</TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {calculateProfitMargin(item)}
                      </span>
                    </TableCell>
                    <TableCell className={`${getExpiryColor(item.expiry_date)}`}>
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Item</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onDeleteItem(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                aria-label={`Delete ${item.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Item</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
