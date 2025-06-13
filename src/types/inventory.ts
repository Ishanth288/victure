
export interface InventoryItemDB {
  id: number;
  name: string;
  generic_name: string | null;
  ndc: string | null;
  manufacturer: string | null;
  dosage_form: string | null;
  strength: string | null;
  unit_size: string | null;
  unit_cost: number;
  selling_price: number | null;
  quantity: number;
  reorder_point: number;
  expiry_date: string | null;
  supplier: string | null;
  storage_condition: string | null;
  status: string;
  created_at: string | null;
}

export interface InventoryItem extends InventoryItemDB {}

export interface InventoryItemFormData {
  name: string;
  genericName: string;
  ndc: string;
  manufacturer: string;
  dosageForm: string;
  strength: string;
  unitSize: string;
  unitCost: string;
  sellingPrice: string;
  quantity: string;
  reorderPoint: string;
  expiryDate: string;
  supplier: string;
  storage: string;
}
