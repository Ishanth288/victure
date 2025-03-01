
import { useState, useEffect } from "react";
import { formatDistance } from "date-fns";
import { Edit2, FileCheck, Printer, Trash2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EditDeliveryDialog } from "./EditDeliveryDialog";
import { PurchaseOrder } from "@/types/purchases";

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onUpdateDelivery: (orderId: number, items: PurchaseOrder['items'], notes: string) => Promise<void>;
  onPreviewBill: (order: PurchaseOrder) => void;
  onDelete?: (orderId: number) => void;
  onEdit?: (order: PurchaseOrder) => void;
}

export function PurchaseOrderCard({ 
  order, 
  onUpdateDelivery, 
  onPreviewBill,
  onDelete,
  onEdit
}: PurchaseOrderCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [lastDelivery, setLastDelivery] = useState<string | null>(null);

  useEffect(() => {
    // Initialize selected items from order
    const initialSelected = order.items
      .filter(item => item.is_delivered)
      .map(item => item.id!)
      .filter(id => id !== undefined);
    
    setSelectedItems(initialSelected);

    // Calculate last delivery date
    const deliveryDates = order.items
      .filter(item => item.delivery_date)
      .map(item => new Date(item.delivery_date!).getTime());
    
    if (deliveryDates.length > 0) {
      const mostRecent = new Date(Math.max(...deliveryDates));
      setLastDelivery(formatDistance(mostRecent, new Date(), { addSuffix: true }));
    }
  }, [order]);

  const totalItemsDelivered = order.items.filter(item => item.is_delivered).length;
  const totalItems = order.items.length;
  const deliveryProgress = Math.round((totalItemsDelivered / totalItems) * 100);

  const handleToggleItem = (itemId: number, checked: boolean) => {
    // This function is just for UI display now, actual changes are made in the EditDeliveryDialog
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleUpdateDelivery = async (items: PurchaseOrder['items'], notes: string) => {
    // Update the local selections first
    const updatedSelected = items
      .filter(item => item.is_delivered)
      .map(item => item.id!)
      .filter(id => id !== undefined);
    
    setSelectedItems(updatedSelected);
    
    // Call the parent handler
    await onUpdateDelivery(order.id!, items, notes);
    
    // Update status based on delivery
    const allDelivered = items.every(item => item.is_delivered);
    if (allDelivered) {
      setOrderStatus('delivered');
    } else if (items.some(item => item.is_delivered)) {
      setOrderStatus('partially_delivered');
    }
    
    setIsEditDialogOpen(false);
  };

  // Helper function to get status display text
  const getStatusDisplayText = (status: 'pending' | 'delivered' | 'partially_delivered') => {
    switch(status) {
      case 'delivered': return 'Completed';
      case 'partially_delivered': return 'Partially Delivered';
      case 'pending': 
      default: return 'Pending';
    }
  };

  // Helper function to get badge variant based on status
  const getStatusBadgeVariant = (status: 'pending' | 'delivered' | 'partially_delivered') => {
    switch(status) {
      case 'delivered': return 'default';
      case 'partially_delivered': return 'outline';
      case 'pending': 
      default: return 'secondary';
    }
  };

  const handleDelete = () => {
    if (onDelete && order.id) {
      onDelete(order.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(order);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.supplier_name}</CardTitle>
            <p className="text-sm text-muted-foreground">PO-{order.id}</p>
          </div>
          <Badge variant={getStatusBadgeVariant(orderStatus)}>
            {getStatusDisplayText(orderStatus)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
            {lastDelivery && <p className="text-sm text-muted-foreground">Last delivery update: {lastDelivery}</p>}
            <p className="text-sm font-medium mt-2">Total: ₹{order.total_amount.toFixed(2)}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Delivery Progress</span>
              <span>{deliveryProgress}% ({totalItemsDelivered}/{totalItems})</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${deliveryProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">Items:</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={selectedItems.includes(item.id!)}
                  onCheckedChange={(checked) => handleToggleItem(item.id!, checked as boolean)}
                  disabled={orderStatus === 'delivered'}
                  className="data-[state=checked]:bg-primary"
                />
                <Label 
                  htmlFor={`item-${item.id}`}
                  className={`text-sm ${item.is_delivered ? 'line-through text-muted-foreground' : ''}`}
                >
                  {item.item_name} ({item.quantity_ordered} × ₹{item.unit_cost.toFixed(2)})
                </Label>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="pt-2">
              <p className="text-sm font-medium">Delivery Notes:</p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Update Delivery
          </Button>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          {onDelete && (
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onPreviewBill(order)}>
            <Printer className="h-4 w-4 mr-2" />
            Print Order
          </Button>
          <Button size="sm" disabled={orderStatus !== 'delivered'}>
            <FileCheck className="h-4 w-4 mr-2" />
            Complete
          </Button>
        </div>
      </CardFooter>

      <EditDeliveryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        order={order}
        onSave={handleUpdateDelivery}
      />
    </Card>
  );
}
