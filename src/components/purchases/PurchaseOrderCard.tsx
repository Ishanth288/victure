
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Printer, Trash2, FileCheck } from "lucide-react";
import { PurchaseOrder, PurchaseOrderItem } from "@/types/purchases";

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onUpdateDelivery: (orderId: number) => void;
  onEditOrder: (order: PurchaseOrder) => void; 
  onDeleteOrder: (orderId: number) => void;
  onPrintOrder: (order: PurchaseOrder) => void;
  onCompleteOrder: (orderId: number) => void;
}

export default function PurchaseOrderCard({
  order,
  onUpdateDelivery,
  onEditOrder,
  onDeleteOrder,
  onPrintOrder,
  onCompleteOrder
}: PurchaseOrderCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalItemsOrdered = order.items.reduce(
    (sum, item) => sum + item.quantity_ordered,
    0
  );
  
  const totalItemsDelivered = order.items.reduce(
    (sum, item) => sum + (item.quantity_delivered || 0),
    0
  );

  const deliveryPercentage = totalItemsOrdered > 0
    ? Math.round((totalItemsDelivered / totalItemsOrdered) * 100)
    : 0;

  const isCompleted = order.status === "completed";
  const isPending = order.status === "pending";

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{order.supplier_name}</h3>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-500 mb-1">PO-{order.id}</p>
        
        <p className="mb-3">Order Date: {new Date(order.order_date).toLocaleDateString()}</p>
        
        <p className="font-semibold mb-2">Total: ₹{order.total_amount.toLocaleString()}</p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Delivery Progress</span>
            <span>{deliveryPercentage}% ({totalItemsDelivered}/{totalItemsOrdered})</span>
          </div>
          <Progress value={deliveryPercentage} className="h-2" />
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="mb-3 w-full justify-start border border-gray-200 hover:bg-gray-50"
        >
          {expanded ? "Hide Items" : "View Items"}
        </Button>
        
        {expanded && (
          <div className="space-y-2 mb-4 pl-2">
            <p className="font-medium text-sm">Items:</p>
            {order.items.map((item: PurchaseOrderItem) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={item.is_delivered} disabled />
                <span className={item.is_delivered ? "line-through text-gray-400" : ""}>
                  {item.item_name} ({item.quantity_delivered}/{item.quantity_ordered} × ₹{item.unit_cost})
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={() => onUpdateDelivery(order.id || 0)}
            disabled={isCompleted}
          >
            Update Delivery
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={() => onEditOrder(order)}
            disabled={isCompleted}
          >
            <Edit className="h-4 w-4" /> Edit Order
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-red-500 hover:bg-red-50 hover:text-red-600" 
            onClick={() => onDeleteOrder(order.id || 0)}
            disabled={isCompleted}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={() => onPrintOrder(order)}
          >
            <Printer className="h-4 w-4" /> Print Order
          </Button>
          
          {isPending && deliveryPercentage === 100 && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700" 
              onClick={() => onCompleteOrder(order.id || 0)}
            >
              <FileCheck className="h-4 w-4" /> Complete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
