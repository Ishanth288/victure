
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

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  created_at: string | null;
  expires_at: string | null;
  created_by: string | null;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_popular: boolean | null;
  category: string | null;
  plan_id: string | null;
  display_order: number | null;
  updated_at: string | null;
  updated_by: string | null;
}
