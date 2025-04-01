
export interface MedicineReturn {
  id: number;
  bill_item_id: number;
  quantity: number;
  reason: string | null;
  return_date: string;
  status: 'inventory' | 'disposed';
  processed_by: string;
  user_id: string;
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
  status: 'inventory' | 'disposed';
  reason: string | null;
}
