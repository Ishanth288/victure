
import { PreviewItem } from "@/types/dataMigration";
import { supabase } from "@/integrations/supabase/client";
import { stableToast } from "@/components/ui/stable-toast";
import { generateMigrationId } from "./idGenerator";
import { logMigration } from "./migrationLog";
import { classifyMedicine, classifyPatient, classifyPrescription } from "../classificationUtils";
import { validateInventoryItem, validatePatientData, validatePrescriptionData } from "../dataValidation";

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
      migration_id: migrationId,
      user_id: patient.user_id || null // Make sure user_id is set from the current authenticated user
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
    
    if (prescription.items && Array.isArray(prescription.items)) {
      const classification = classifyPrescription(prescription.items);
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
