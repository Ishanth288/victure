
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit, 
  Printer, 
  Trash2, 
  FileCheck, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { PurchaseOrder, PurchaseOrderItem } from "@/types/purchases";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Status badge variant and text formatting
  const getBadgeVariant = () => {
    switch (order.status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "partially_delivered":
        return "warning";
      default:
        return "secondary";
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{order.supplier_name}</h3>
          <Badge variant={getBadgeVariant()}>
            {formatStatus(order.status)}
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
          className="mb-3 w-full justify-between border border-gray-200 hover:bg-gray-50"
        >
          {expanded ? "Hide Items" : "View Items"}
          {expanded ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1" 
                  onClick={() => onUpdateDelivery(order.id || 0)}
                  disabled={isCompleted}
                >
                  Update Delivery
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Update delivery status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1" 
                  onClick={() => onEditOrder(order)}
                  disabled={isCompleted}
                >
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit order details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 text-red-500 hover:bg-red-50 hover:text-red-600" 
                  onClick={() => onDeleteOrder(order.id || 0)}
                  disabled={isCompleted}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete this order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1" 
                  onClick={() => onPrintOrder(order)}
                >
                  <Printer className="h-4 w-4" /> Print
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print order details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isPending && deliveryPercentage === 100 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => onCompleteOrder(order.id || 0)}
                  >
                    <FileCheck className="h-4 w-4" /> Complete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark order as completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </Card>
  );
}
