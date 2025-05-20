
// Data migration types
export type WarningType = "expired" | "duplicate" | "missing" | "price" | "controlled" | "invalid";

export interface PreviewItem {
  name: string;
  generic_name?: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  quantity?: number;
  unit_cost?: number;
  selling_price?: number;
  schedule?: string;
  hsn_code?: string;
  category?: string;
  hasWarning?: boolean;
  warningType?: WarningType;
  warningMessage?: string;
  
  // Patient specific fields
  phone_number?: string;
  external_id?: string;
  status?: string;
  patient_type?: string;
  visit_count?: number;
  is_first_visit?: boolean;
  chronic_diseases?: string[];
  recent_prescription_count?: number;
  
  // Prescription specific fields
  prescription_number?: string;
  doctor_name?: string;
  date?: string;
  polytherapy?: boolean;
  prescription_type?: string;
  items?: PreviewItem[];
  patient_id?: number | null;
  user_id?: string | null;
  
  // Migration tracking
  migration_id?: string;
}

export interface MigrationLog {
  id?: string;
  migration_id: string;
  type: 'Inventory' | 'Patients' | 'Prescriptions';
  timestamp: string;
  added_count: number;
  skipped_count: number;
  issues: Array<{
    row: number;
    reason: string;
  }>;
}

export interface MappingTemplate {
  id?: string;
  user_id?: string;
  name: string;
  source_system: string;
  data_type: 'Inventory' | 'Patients' | 'Prescriptions';
  mappings: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}
