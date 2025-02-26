
export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit_cost: number;
  total: number;
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
  prescription?: {
    patient?: {
      name: string;
      phone_number: string;
    };
    doctor_name?: string;
    prescription_number?: string;
  };
}
