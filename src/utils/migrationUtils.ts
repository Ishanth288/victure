
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { PreviewItem, MigrationLog } from "@/types/dataMigration";
import { classifyMedicine, classifyPatient, classifyPrescription } from "./classificationUtils";
import { validateInventoryItem, validatePatientData, validatePrescriptionData } from "./dataValidation";
import { stableToast } from "@/components/ui/stable-toast";

/**
 * Generates a unique migration ID
 */
export function generateMigrationId(): string {
  return uuidv4();
}

/**
 * Processes inventory items for migration
 */
export async function processInventoryItems(
  items: PreviewItem[]
): Promise<{ success: boolean; added: number; skipped: number; issues: any[] }> {
  const migrationId = generateMigrationId();
  const processedItems = [];
  const issues = [];
  
  // Process each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { valid, warnings } = validateInventoryItem(item);
    
    if (!valid) {
      issues.push({ row: i + 1, reason: warnings[0]?.message || "Validation failed" });
      continue;
    }
    
    // Add classification and migration ID
    const category = classifyMedicine(item.generic_name, item.name);
    
    // Prepare for database
    const dbItem = {
      name: item.name,
      generic_name: item.generic_name || null,
      manufacturer: item.manufacturer || null,
      ndc: item.batch_number || null,
      expiry_date: item.expiry_date || null,
      quantity: item.quantity || 0,
      unit_cost: item.unit_cost || 0,
      selling_price: item.selling_price || null,
      dosage_form: null,
      strength: null,
      unit_size: null,
      supplier: null,
      storage_condition: null,
      status: 'in stock',
      // Custom fields for tracking
      migration_id: migrationId,
      category: category
    };
    
    processedItems.push(dbItem);
  }
  
  if (processedItems.length > 0) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(processedItems);
        
      if (error) {
        console.error('❌ Insert failed:', error.message);
        stableToast({
          title: "Import Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return { success: false, added: 0, skipped: items.length, issues: [{ row: 0, reason: error.message }] };
      }
      
      // Log the migration
      await logMigration({
        migration_id: migrationId,
        type: 'Inventory',
        timestamp: new Date().toISOString(),
        added_count: processedItems.length,
        skipped_count: items.length - processedItems.length,
        issues
      });
      
      return {
        success: true,
        added: processedItems.length,
        skipped: items.length - processedItems.length,
        issues
      };
    } catch (err) {
      console.error('Failed to insert inventory items:', err);
      return { success: false, added: 0, skipped: items.length, issues: [{ row: 0, reason: String(err) }] };
    }
  }
  
  return { success: false, added: 0, skipped: items.length, issues };
}

/**
 * Processes patient data for migration
 */
export async function processPatients(
  patients: PreviewItem[]
): Promise<{ success: boolean; added: number; skipped: number; issues: any[] }> {
  const migrationId = generateMigrationId();
  const processedPatients = [];
  const issues = [];
  
  // Process each patient
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const { valid, warnings } = validatePatientData(patient);
    
    if (!valid) {
      issues.push({ row: i + 1, reason: warnings[0]?.message || "Validation failed" });
      continue;
    }
    
    // Add classification
    const patientType = classifyPatient(patient);
    
    // Prepare for database
    const dbPatient = {
      name: patient.name,
      phone_number: patient.phone_number,
      status: patient.status || 'active',
      patient_type: patientType,
      migration_id: migrationId
    };
    
    processedPatients.push(dbPatient);
  }
  
  if (processedPatients.length > 0) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert(processedPatients);
        
      if (error) {
        console.error('❌ Patient insert failed:', error.message);
        stableToast({
          title: "Patient Import Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return { success: false, added: 0, skipped: patients.length, issues: [{ row: 0, reason: error.message }] };
      }
      
      // Log the migration
      await logMigration({
        migration_id: migrationId,
        type: 'Patients',
        timestamp: new Date().toISOString(),
        added_count: processedPatients.length,
        skipped_count: patients.length - processedPatients.length,
        issues
      });
      
      return {
        success: true,
        added: processedPatients.length,
        skipped: patients.length - processedPatients.length,
        issues
      };
    } catch (err) {
      console.error('Failed to insert patients:', err);
      return { success: false, added: 0, skipped: patients.length, issues: [{ row: 0, reason: String(err) }] };
    }
  }
  
  return { success: false, added: 0, skipped: patients.length, issues };
}

/**
 * Processes prescription data for migration
 */
export async function processPrescriptions(
  prescriptions: PreviewItem[]
): Promise<{ success: boolean; added: number; skipped: number; issues: any[] }> {
  const migrationId = generateMigrationId();
  const processedPrescriptions = [];
  const issues = [];
  
  // Process each prescription
  for (let i = 0; i < prescriptions.length; i++) {
    const prescription = prescriptions[i];
    const { valid, warnings } = validatePrescriptionData(prescription);
    
    if (!valid) {
      issues.push({ row: i + 1, reason: warnings[0]?.message || "Validation failed" });
      continue;
    }
    
    // Add classification if there are associated items
    let prescriptionType = "Regular";
    let polytherapy = false;
    
    if (prescription.items) {
      const classification = classifyPrescription(prescription.items as any);
      prescriptionType = classification.prescription_type;
      polytherapy = classification.polytherapy;
    }
    
    // Prepare for database
    const dbPrescription = {
      prescription_number: prescription.prescription_number,
      doctor_name: prescription.doctor_name,
      date: prescription.date,
      status: prescription.status || 'active',
      patient_id: prescription.patient_id || null,
      user_id: prescription.user_id || null,
      prescription_type: prescriptionType,
      polytherapy: polytherapy,
      migration_id: migrationId
    };
    
    processedPrescriptions.push(dbPrescription);
  }
  
  if (processedPrescriptions.length > 0) {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .insert(processedPrescriptions);
        
      if (error) {
        console.error('❌ Prescription insert failed:', error.message);
        stableToast({
          title: "Prescription Import Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
        return { success: false, added: 0, skipped: prescriptions.length, issues: [{ row: 0, reason: error.message }] };
      }
      
      // Log the migration
      await logMigration({
        migration_id: migrationId,
        type: 'Prescriptions',
        timestamp: new Date().toISOString(),
        added_count: processedPrescriptions.length,
        skipped_count: prescriptions.length - processedPrescriptions.length,
        issues
      });
      
      return {
        success: true,
        added: processedPrescriptions.length,
        skipped: prescriptions.length - processedPrescriptions.length,
        issues
      };
    } catch (err) {
      console.error('Failed to insert prescriptions:', err);
      return { success: false, added: 0, skipped: prescriptions.length, issues: [{ row: 0, reason: String(err) }] };
    }
  }
  
  return { success: false, added: 0, skipped: prescriptions.length, issues };
}

/**
 * Logs a migration event to the migration_logs table
 */
async function logMigration(log: MigrationLog) {
  try {
    const { data, error } = await supabase
      .from('migration_logs')
      .insert([log]);
      
    if (error) {
      console.error('Failed to log migration:', error);
    }
  } catch (err) {
    console.error('Error logging migration:', err);
  }
}

/**
 * Rolls back a migration by deleting records with the given migration ID
 */
export async function rollbackMigration(
  migrationId: string, 
  type: 'Inventory' | 'Patients' | 'Prescriptions'
): Promise<boolean> {
  try {
    let tableName = '';
    switch (type) {
      case 'Inventory':
        tableName = 'inventory';
        break;
      case 'Patients':
        tableName = 'patients';
        break;
      case 'Prescriptions':
        tableName = 'prescriptions';
        break;
    }
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('migration_id', migrationId);
      
    if (error) {
      console.error(`Failed to rollback ${type} migration:`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Rollback error:', err);
    return false;
  }
}

/**
 * Gets the list of recent migrations
 */
export async function getRecentMigrations(): Promise<MigrationLog[]> {
  try {
    const { data, error } = await supabase
      .from('migration_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Failed to fetch migration logs:', error);
      return [];
    }
    
    return data as MigrationLog[];
  } catch (err) {
    console.error('Error fetching migration logs:', err);
    return [];
  }
}

/**
 * Auto-detects field mappings based on historical data and column name patterns
 */
export function autoDetectFieldMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase();
    
    // Inventory mappings
    if (/med(icine)?[\s_-]?name|product[\s_-]?name|drug[\s_-]?name|item[\s_-]?name/i.test(lowerHeader)) {
      mappings[header] = 'name';
    } 
    else if (/generic/i.test(lowerHeader)) {
      mappings[header] = 'generic_name';
    }
    else if (/mfg|manufacturer|company|maker/i.test(lowerHeader)) {
      mappings[header] = 'manufacturer';
    }
    else if (/batch|lot[\s_-]?no|batch[\s_-]?number|ndc/i.test(lowerHeader)) {
      mappings[header] = 'batch_number';
    }
    else if (/exp|expir(y|ation)|valid[\s_-]?until/i.test(lowerHeader)) {
      mappings[header] = 'expiry_date';
    }
    else if (/qty|quant(ity)?|stock/i.test(lowerHeader)) {
      mappings[header] = 'quantity';
    }
    else if (/cost|buy[\s_-]?price|purchase[\s_-]?price/i.test(lowerHeader)) {
      mappings[header] = 'unit_cost';
    }
    else if (/mrp|sell[\s_-]?price|retail[\s_-]?price|price/i.test(lowerHeader)) {
      mappings[header] = 'selling_price';
    }
    else if (/sched(ule)?|control(led)?/i.test(lowerHeader)) {
      mappings[header] = 'schedule';
    }
    else if (/hsn[\s_-]?code|gst[\s_-]?code/i.test(lowerHeader)) {
      mappings[header] = 'hsn_code';
    }
    
    // Patient mappings
    else if (/patient[\s_-]?name|name/i.test(lowerHeader)) {
      mappings[header] = 'name';
    }
    else if (/phone|mobile|contact/i.test(lowerHeader)) {
      mappings[header] = 'phone_number';
    }
    else if (/status|state/i.test(lowerHeader)) {
      mappings[header] = 'status';
    }
    else if (/visits|visit[\s_-]?count/i.test(lowerHeader)) {
      mappings[header] = 'visit_count';
    }
    
    // Prescription mappings
    else if (/rx[\s_-]?(no|number)|prescription[\s_-]?(no|number)/i.test(lowerHeader)) {
      mappings[header] = 'prescription_number';
    }
    else if (/doctor|physician|prescribed[\s_-]?by/i.test(lowerHeader)) {
      mappings[header] = 'doctor_name';
    }
    else if (/date|rx[\s_-]?date|prescribed[\s_-]?on/i.test(lowerHeader)) {
      mappings[header] = 'date';
    }
  });
  
  return mappings;
}
