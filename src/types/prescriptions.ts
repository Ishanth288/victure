
export interface Prescription {
  id: number;
  prescription_number: string;
  patient_id: number;
  doctor_name: string;
  date: string;
  status: 'active' | 'inactive';
  user_id: string;
  patient?: {
    name: string;
  };
  bills?: Bill[];
  total_amount?: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  prescription_id: number;
  total_amount: number;
  status?: string;
}
