
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PurchaseOrderItem } from "@/types/purchases";

interface EditDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PurchaseOrderItem[];
  onSave: (items: PurchaseOrderItem[], notes: string) => void;
}

export function EditDeliveryDialog({
  open,
  onOpenChange,
  items,
  onSave,
}: EditDeliveryDialogProps) {
  const [editedItems, setEditedItems] = useState<PurchaseOrderItem[]>(items);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSave(editedItems, notes);
    onOpenChange(false);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      quantity_delivered: quantity,
      is_delivered: quantity === newItems[index].quantity_ordered,
    };
    setEditedItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Delivery Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            {editedItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label>{item.item_name}</Label>
                </div>
                <div className="w-32">
                  <Label>Ordered: {item.quantity_ordered}</Label>
                </div>
                <div className="w-40">
                  <Input
                    type="number"
                    value={item.quantity_delivered}
                    onChange={(e) =>
                      handleQuantityChange(index, parseInt(e.target.value))
                    }
                    min="0"
                    max={item.quantity_ordered}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Delivery Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about expired items or other delivery issues..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
