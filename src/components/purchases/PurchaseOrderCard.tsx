
import { useState } from "react";
import { Eye, Check, Edit } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditDeliveryDialog } from "./EditDeliveryDialog";
import type { PurchaseOrder } from "@/types/purchases";

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onUpdateDelivery: (
    orderId: number,
    items: PurchaseOrder["items"],
    notes: string
  ) => void;
  onPreviewBill: (order: PurchaseOrder) => void;
}

export function PurchaseOrderCard({
  order,
  onUpdateDelivery,
  onPreviewBill,
}: PurchaseOrderCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleSaveDelivery = (items: PurchaseOrder["items"], notes: string) => {
    onUpdateDelivery(order.id!, items, notes);
  };

  const isFullyDelivered = order.items.every((item) => item.is_delivered);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{order.supplier_name}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Delivery
            </Button>
            {isFullyDelivered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreviewBill(order)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Bill
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Order Date: {format(new Date(order.order_date), "PP")}</span>
            <span>Phone: {order.supplier_phone}</span>
          </div>

          <ScrollArea className="h-40">
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity_ordered} × ₹{item.unit_cost}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.is_delivered && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {order.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium">Notes:</p>
              <p className="text-sm text-gray-500">{order.notes}</p>
            </div>
          )}
        </div>
      </CardContent>

      <EditDeliveryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        items={order.items}
        onSave={handleSaveDelivery}
      />
    </Card>
  );
}
