export type DBPurchaseOrder = {
  id: number;
  supplier_name: string;
  supplier_phone: string | null;
  order_date: string;
  status: string;
  notes: string | null;
  delivery_notes: string | null;
  total_amount: number;
  items: DBPurchaseOrderItem[];
};

export type DBPurchaseOrderItem = {
  id: number;
  item_name: string;
  quantity_ordered: number;
  quantity_delivered: number;
  unit_cost: number;
  total_cost: number;
  is_delivered: boolean;
  delivery_notes: string | null;
};

export interface SystemSettings {
  id?: number;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  maintenance_announcement?: string;
  maintenance_announced_at?: string;
}
