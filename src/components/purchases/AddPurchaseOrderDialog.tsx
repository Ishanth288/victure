
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { NewPurchaseOrderItem } from "@/types/purchases";

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    supplier_name: string;
    supplier_phone: string;
    order_date: string;
    items: NewPurchaseOrderItem[];
  }) => void;
}

export function AddPurchaseOrderDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddPurchaseOrderDialogProps) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [items, setItems] = useState<NewPurchaseOrderItem[]>([]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { item_name: "", quantity_ordered: 0, unit_cost: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof NewPurchaseOrderItem,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === "item_name" ? value : Number(value),
    };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      supplier_name: supplierName,
      supplier_phone: supplierPhone,
      order_date: orderDate,
      items,
    });
    setSupplierName("");
    setSupplierPhone("");
    setOrderDate("");
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_phone">Supplier Phone</Label>
              <Input
                id="supplier_phone"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order_date">Order Date</Label>
              <Input
                id="order_date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button type="button" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Item name"
                    value={item.item_name}
                    onChange={(e) =>
                      handleItemChange(index, "item_name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity_ordered || ""}
                    onChange={(e) =>
                      handleItemChange(index, "quantity_ordered", e.target.value)
                    }
                    required
                    min="1"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    placeholder="Unit Cost"
                    value={item.unit_cost || ""}
                    onChange={(e) =>
                      handleItemChange(index, "unit_cost", e.target.value)
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Order</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
