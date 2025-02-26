
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
  const { error: orderError } = await supabase
    .from('purchase_orders')
    .update({ 
      notes,
      status: items.every(item => item.is_delivered) ? 'delivered' : 'partially_delivered'
    })
    .eq('id', orderId);

  if (orderError) throw orderError;

  for (const item of items) {
    const { error: itemError } = await supabase
      .from('purchase_order_items')
      .update({
        quantity_delivered: item.quantity_delivered,
        is_delivered: item.is_delivered,
      })
      .eq('id', item.id);

    if (itemError) throw itemError;
  }
};
