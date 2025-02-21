
export interface InventoryItem {
  id: number;
  name: string;
  ndc: string;
  manufacturer: string;
  dosageForm: string;
  unitSize: string;
  quantity: number;
  unitCost: number;
  expiryDate: string;
  supplier: string;
  status: string;
}

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
