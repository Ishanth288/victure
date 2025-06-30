
export interface MedicineReturn {
  id: number;
  bill_item_id: number;
  quantity_returned: number;
  reason: string | null;
  refund_amount: number;
  created_at: string;
}

export interface ReturnHistoryItem {
  id: number;
  bill_item_id: number;
  inventory_item_id: number;
  medicine_name: string;
  original_quantity: number;
  returned_quantity: number;
  unit_price: number;
  return_value: number;
  return_date: string;
  reason: string | null;
  prescription_id?: number;
}

// Database types matching Supabase schema
export interface DatabaseMedicineReturn {
  id: number;
  bill_item_id: number;
  quantity_returned: number;
  reason: string | null;
  refund_amount: number;
  created_at: string | null;
}
