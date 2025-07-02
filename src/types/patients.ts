
export interface PatientBill {
  id: number;
  date: string;
  total_amount: number;
  subtotal: number;
  gst_amount: number;
  gst_percentage: number;
  discount_amount: number;
  bill_number: string;
  status: string;
  bill_items: {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    inventory_item_id: number;
    inventory: {
      name: string;
    };
  }[];
  prescription: {
    doctor_name: string;
    prescription_number: string;
    patient: {
      name: string;
      phone_number: string;
    };
  };
}

export interface Patient {
  id: number;
  name: string;
  phone_number: string;
  user_id: string;
  created_at: string;
  bills: PatientBill[];
  prescriptions: {
    id: number;
    prescription_number: string;
    doctor_name: string;
    date: string;
    status: string;
    user_id: string;
    bills: PatientBill[];
  }[];
  total_spent: number;
  status: string;
  is_flagged?: boolean;
  migration_id?: string | null;
}
