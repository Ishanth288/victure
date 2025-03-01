
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { PurchaseOrder, NewPurchaseOrderItem } from "@/types/purchases";

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  initialData?: PurchaseOrder;
  isEditing?: boolean;
}

export function AddPurchaseOrderDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  initialData,
  isEditing = false 
}: AddPurchaseOrderDialogProps) {
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<NewPurchaseOrderItem[]>([
    { item_name: "", quantity_ordered: 1, unit_cost: 0 }
  ]);

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData && isEditing) {
      setSupplierName(initialData.supplier_name);
      setSupplierPhone(initialData.supplier_phone || "");
      setOrderDate(format(new Date(initialData.order_date), "yyyy-MM-dd"));
      
      if (initialData.items.length > 0) {
        const formattedItems = initialData.items.map(item => ({
          item_name: item.item_name,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost
        }));
        setItems(formattedItems);
      }
    } else {
      // Reset form for new order
      setSupplierName("");
      setSupplierPhone("");
      setOrderDate(format(new Date(), "yyyy-MM-dd"));
      setItems([{ item_name: "", quantity_ordered: 1, unit_cost: 0 }]);
    }
  }, [initialData, isEditing, open]);

  const handleAddItem = () => {
    setItems([...items, { item_name: "", quantity_ordered: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof NewPurchaseOrderItem, value: string | number) => {
    const newItems = [...items];
    if (field === 'item_name') {
      newItems[index].item_name = value as string;
    } else if (field === 'quantity_ordered') {
      newItems[index].quantity_ordered = Number(value);
    } else if (field === 'unit_cost') {
      newItems[index].unit_cost = Number(value);
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.quantity_ordered * item.unit_cost);
    }, 0);
  };

  const handleSubmit = () => {
    // Validate form
    if (!supplierName.trim()) {
      alert("Please enter supplier name");
      return;
    }

    if (items.some(item => !item.item_name.trim() || item.quantity_ordered <= 0)) {
      alert("Please fill in all item details correctly");
      return;
    }

    const formData = {
      supplier_name: supplierName,
      supplier_phone: supplierPhone,
      order_date: orderDate,
      items: items
    };

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Purchase Order" : "Create New Purchase Order"}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name *</Label>
                  <Input
                    id="supplierName"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierPhone">Supplier Phone</Label>
                  <Input
                    id="supplierPhone"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="Enter supplier phone"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Order Items</h3>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="space-y-3 border p-3 rounded-md relative">
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor={`item-name-${index}`}>Item Name *</Label>
                    <Input
                      id={`item-name-${index}`}
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      placeholder="Enter item name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity_ordered}
                        onChange={(e) => handleItemChange(index, 'quantity_ordered', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`unit-cost-${index}`}>Unit Cost (₹) *</Label>
                      <Input
                        id={`unit-cost-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost}
                        onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="text-right text-sm font-medium">
                    Subtotal: ₹{(item.quantity_ordered * item.unit_cost).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 mt-4 text-lg font-medium">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Update Order" : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
