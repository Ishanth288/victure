
import { useState, useEffect } from "react";
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
  orderItems: PurchaseOrderItem[];
  onSubmit: (items: any) => void;
  orderId?: number; // Make orderId optional to match the external usage
}

export function EditDeliveryDialog({
  open,
  onOpenChange,
  orderItems,
  onSubmit,
  orderId,
}: EditDeliveryDialogProps) {
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Initialize edited items when orderItems change
  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      const formattedItems = orderItems.map(item => ({
        id: item.id,
        item_name: item.item_name,
        quantityOrdered: item.quantity_ordered,
        quantityDelivered: item.quantity_delivered || 0,
        notes: item.delivery_notes || "",
      }));
      setEditedItems(formattedItems);
    }
  }, [orderItems]);

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      quantityDelivered: quantity,
    };
    setEditedItems(newItems);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      notes: notes,
    };
    setEditedItems(newItems);
  };

  const handleSubmit = () => {
    onSubmit(editedItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Delivery</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            {editedItems.map((item, index) => (
              <div key={index} className="space-y-2 border-b pb-4">
                <div className="font-semibold">{item.item_name}</div>
                <div className="flex items-center gap-4">
                  <div className="w-1/2">
                    <Label htmlFor={`quantity-${index}`}>Delivered Quantity</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="0"
                      max={item.quantityOrdered}
                      value={item.quantityDelivered}
                      onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Ordered: {item.quantityOrdered}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <Label htmlFor={`notes-${index}`}>Item Notes</Label>
                    <Input
                      id={`notes-${index}`}
                      type="text"
                      value={item.notes}
                      onChange={(e) => handleNotesChange(index, e.target.value)}
                      placeholder="Optional notes for this item"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-notes">Delivery Notes</Label>
            <Textarea
              id="delivery-notes"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Add any notes about the delivery..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
