
import { supabase } from "@/integrations/supabase/client";
import { formatOrderData } from "@/utils/purchaseOrderUtils";
import type { PurchaseOrder } from "@/types/purchases";
import type { DBPurchaseOrder } from "@/types/database";

export const fetchPurchaseOrders = async (userId: string): Promise<PurchaseOrder[]> => {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      supplier_name,
      supplier_phone,
      order_date,
      status,
      notes,
      delivery_notes,
      total_amount,
      items:purchase_order_items (
        id,
        item_name,
        quantity_ordered,
        quantity_delivered,
        unit_cost,
        total_cost,
        is_delivered,
        delivery_notes
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data ? data.map((order: DBPurchaseOrder) => formatOrderData(order)) : [];
};

export const createPurchaseOrder = async (userId: string, orderData: any) => {
  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      user_id: userId,
      ...orderData
    })
    .select()
    .single();

  if (orderError) throw orderError;
  return order;
};

export const createOrderItems = async (items: any[]) => {
  const { error } = await supabase
    .from('purchase_order_items')
    .insert(items);

  if (error) throw error;
};

export const updatePurchaseOrderDelivery = async (
  orderId: number,
  items: PurchaseOrder["items"],
  notes: string
) => {
  // Update order with notes and status
  const allItemsDelivered = items.every(item => 
    Number(item.quantity_delivered) >= Number(item.quantity_ordered)
  );
  
  const { error: orderError } = await supabase
    .from('purchase_orders')
    .update({ 
      delivery_notes: notes,
      status: allItemsDelivered ? 'delivered' : 'partially_delivered'
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Update each item
  for (const item of items) {
    const { error: itemError } = await supabase
      .from('purchase_order_items')
      .update({
        quantity_delivered: item.quantity_delivered,
        is_delivered: Number(item.quantity_delivered) >= Number(item.quantity_ordered),
        delivery_notes: item.delivery_notes,
      })
      .eq('id', item.id);

    if (itemError) throw itemError;
  }
};

export const markOrderComplete = async (orderId: number) => {
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'completed' })
    .eq('id', orderId);

  if (error) throw error;
};
