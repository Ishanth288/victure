
export interface PatientBill {
  id: number;
  date: string;
  total_amount: number;
  bill_number: string;
  prescription: {
    doctor_name: string;
  };
}

export interface Patient {
  id: number;
  name: string;
  phone_number: string;
  bills: PatientBill[];
  prescriptions?: any[];
  total_spent: number;
  status: string;
}
