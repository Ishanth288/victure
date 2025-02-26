
import type { PurchaseOrder, PurchaseOrderItem } from "@/types/purchases";
import type { DBPurchaseOrder } from "@/types/database";

export const formatOrderData = (order: DBPurchaseOrder): PurchaseOrder => {
  const status = order.status as PurchaseOrder['status'];
  if (!['pending', 'delivered', 'partially_delivered'].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  return {
    id: order.id,
    supplier_name: order.supplier_name,
    supplier_phone: order.supplier_phone || '',
    order_date: order.order_date,
    status,
    notes: order.notes || undefined,
    total_amount: order.total_amount,
    items: order.items.map((item): PurchaseOrderItem => ({
      id: item.id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      quantity_delivered: item.quantity_delivered,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      is_delivered: item.is_delivered,
      delivery_notes: item.delivery_notes || undefined
    }))
  };
};

export const calculateTotalAmount = (items: Array<{ quantity_ordered: number; unit_cost: number }>) => {
  return items.reduce(
    (sum: number, item) => sum + item.quantity_ordered * item.unit_cost,
    0
  );
};
