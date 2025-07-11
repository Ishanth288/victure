
export interface CartItem {
  id: number;
  name: string;
  ndc?: string;
  quantity: number;
  unit_cost: number;
  total: number;
  available_quantity?: number;
}

export interface BillData {
  id: number;
  bill_number: string;
  prescription_id: number;
  subtotal: number;
  gst_amount: number;
  gst_percentage: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  prescription?: {
    patient?: {
      name: string;
      phone_number: string;
    };
    doctor_name?: string;
    prescription_number?: string;
  };
}
