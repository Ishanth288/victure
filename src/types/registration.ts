
export interface RegistrationData {
  pharmacyName?: string;
  ownerName?: string;
  pharmacy_name?: string;
  owner_name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  role?: string;
  name?: string; // Added name field to fix the type error
}
