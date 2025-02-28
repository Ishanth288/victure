
export interface PurchaseOrderItem {
  id?: number;
  item_name: string;
  quantity_ordered: number;
  quantity_delivered: number;
  unit_cost: number;
  total_cost: number;
  is_delivered: boolean;
  delivery_notes?: string;
  delivery_date?: string; // Add delivery_date property
}

export interface PurchaseOrder {
  id?: number;
  supplier_name: string;
  supplier_phone: string;
  order_date: string;
  status: 'pending' | 'delivered' | 'partially_delivered';
  notes?: string;
  delivery_notes?: string; // Add delivery_notes property
  total_amount: number;
  items: PurchaseOrderItem[];
}

export interface NewPurchaseOrderItem {
  item_name: string;
  quantity_ordered: number;
  unit_cost: number;
}
