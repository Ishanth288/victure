import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { PreviewItem, MigrationLog, MappingTemplate } from "@/types/dataMigration";
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

/**
 * Logs a migration event
 * Note: We'll insert directly since the table might not be fully typed yet
 */
async function logMigration(log: MigrationLog) {
  try {
    // Use explicit typing to bypass type constraints
    await supabase.from('migration_logs').insert([{
      migration_id: log.migration_id,
      type: log.type,
      timestamp: log.timestamp,
      added_count: log.added_count,
      skipped_count: log.skipped_count,
      issues: log.issues
    }]);
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
    // Using the type-safe approach for known table names
    if (type === 'Inventory') {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
    } else if (type === 'Patients') {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
    } else if (type === 'Prescriptions') {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('migration_id', migrationId);
        
      if (error) {
        console.error(`Failed to rollback ${type} migration:`, error);
        return false;
      }
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
    
    // Add explicit type assertion to handle the type mismatch
    return (data || []) as MigrationLog[];
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
  
  // Pattern dictionary for different field types
  const patternDictionary = {
    // Inventory item fields
    name: [
      /^med(icine)?[\s_-]?name$/i,
      /^product[\s_-]?name$/i,
      /^drug[\s_-]?name$/i,
      /^item[\s_-]?name$/i,
      /^prod(uct)?[\s_-]?(title|name)$/i,
      /^title$/i,
      /^med[\s_-]?title$/i,
      /^product_item$/i,
      /^item[\s_-]?descr(iption)?$/i,
      /^drug[\s_-]?descr(iption)?$/i,
      /^med[\s_-]?descr(iption)?$/i,
      /^item[\s_-]?p$/i,
      /^p[\s_-]?name$/i
    ],
    
    generic_name: [
      /^generic$/i,
      /^gen[\s_-]?name$/i,
      /^generic[\s_-]?descr(iption)?$/i,
      /^chemical[\s_-]?name$/i,
      /^molecule$/i,
      /^mol[\s_-]?name$/i,
      /^mole?[\s_-]?name$/i,
      /^cmn$/i, // common molecular name
      /^inn$/i  // international nonproprietary name
    ],
    
    manufacturer: [
      /^mfg$/i,
      /^manufacturer$/i,
      /^company$/i,
      /^maker$/i,
      /^vendor$/i,
      /^manuf$/i,
      /^comp[\s_-]?name$/i,
      /^firm$/i,
      /^producer$/i,
      /^lab$/i,
      /^laboratory$/i,
      /^brand$/i
    ],
    
    batch_number: [
      /^batch$/i,
      /^lot[\s_-]?no$/i,
      /^batch[\s_-]?number$/i,
      /^lot[\s_-]?number$/i,
      /^lot[\s_-]?id$/i,
      /^ndc$/i,
      /^batch[\s_-]?id$/i,
      /^lot$/i,
      /^batch[\s_-]?no$/i,
      /^serial[\s_-]?no$/i,
      /^serial$/i
    ],
    
    expiry_date: [
      /^exp$/i,
      /^expir[ey]$/i,
      /^expir(y|ation)[\s_-]?date$/i,
      /^valid[\s_-]?until$/i,
      /^exp[\s_-]?date$/i,
      /^use[\s_-]?by$/i,
      /^good[\s_-]?until$/i,
      /^exp[\s_-]?dt$/i,
      /^perm$/i,
      /^shelf[\s_-]?life$/i
    ],
    
    quantity: [
      /^qty$/i,
      /^quant(ity)?$/i,
      /^stock$/i,
      /^avail(able)?[\s_-]?units$/i,
      /^count$/i,
      /^units$/i,
      /^stock[\s_-]?level$/i,
      /^avail(able)?[\s_-]?count$/i,
      /^inventory$/i,
      /^inv[\s_-]?count$/i,
      /^stock[\s_-]?qty$/i,
      /^pcs$/i,
      /^in[\s_-]?stock$/i,
      /^on[\s_-]?hand$/i
    ],
    
    unit_cost: [
      /^cost$/i,
      /^buy[\s_-]?price$/i,
      /^purchase[\s_-]?price$/i,
      /^cost[\s_-]?price$/i,
      /^unit[\s_-]?cost$/i,
      /^acquisition[\s_-]?cost$/i,
      /^per[\s_-]?unit[\s_-]?cost$/i,
      /^wholesale[\s_-]?price$/i,
      /^wsp$/i,
      /^base[\s_-]?price$/i,
      /^cp$/i // cost price
    ],
    
    selling_price: [
      /^mrp$/i,
      /^sell[\s_-]?price$/i,
      /^retail[\s_-]?price$/i,
      /^price$/i,
      /^sales[\s_-]?price$/i,
      /^unit[\s_-]?price$/i,
      /^msp$/i, // maximum selling price
      /^max[\s_-]?retail[\s_-]?price$/i,
      /^sp$/i,
      /^rp$/i, // retail price
      /^rate$/i
    ],
    
    hsn_code: [
      /^hsn[\s_-]?code$/i,
      /^gst[\s_-]?code$/i,
      /^tax[\s_-]?code$/i,
      /^tax[\s_-]?class$/i,
      /^tariff$/i,
      /^tax[\s_-]?category$/i
    ],
    
    // Patient fields
    "name": [
      /^patient[\s_-]?name$/i,
      /^client[\s_-]?name$/i,
      /^customer[\s_-]?name$/i,
      /^cust[\s_-]?name$/i,
      /^pt[\s_-]?name$/i,
      /^person$/i,
      /^full[\s_-]?name$/i,
      /^name$/i
    ],
    
    phone_number: [
      /^phone$/i,
      /^mobile$/i,
      /^contact$/i,
      /^phone[\s_-]?number$/i,
      /^mobile[\s_-]?number$/i,
      /^tel$/i,
      /^telephone$/i,
      /^contact[\s_-]?number$/i,
      /^cell$/i,
      /^cell[\s_-]?number$/i,
      /^ph[\s_-]?no$/i,
      /^mob[\s_-]?no$/i
    ],
    
    // Prescription fields
    prescription_number: [
      /^rx[\s_-]?(no|number)$/i,
      /^prescription[\s_-]?(no|number)$/i,
      /^script[\s_-]?(no|number)$/i,
      /^presc[\s_-]?(no|number)$/i,
      /^rx[\s_-]?id$/i,
      /^script[\s_-]?id$/i,
      /^order[\s_-]?(no|number|id)$/i
    ],
    
    doctor_name: [
      /^doctor$/i,
      /^physician$/i,
      /^prescribed[\s_-]?by$/i,
      /^dr[\s_-]?name$/i,
      /^prescriber$/i,
      /^md$/i,
      /^doctor[\s_-]?name$/i,
      /^practitioner$/i,
      /^consultant$/i
    ],
    
    date: [
      /^date$/i,
      /^rx[\s_-]?date$/i,
      /^prescription[\s_-]?date$/i,
      /^prescribed[\s_-]?(on|date)$/i,
      /^issue[\s_-]?date$/i,
      /^order[\s_-]?date$/i,
      /^visit[\s_-]?date$/i,
      /^pres[\s_-]?date$/i,
      /^created[\s_-]?(on|at|date)$/i
    ]
  };
  
  // Apply pattern matching to each header
  headers.forEach(header => {
    const cleanHeader = header.trim();
    let matched = false;
    
    // Check against each pattern category
    for (const [fieldName, patterns] of Object.entries(patternDictionary)) {
      for (const pattern of patterns) {
        if (pattern.test(cleanHeader)) {
          mappings[header] = fieldName;
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    
    // Fallback to direct partial string matching if no pattern match
    if (!matched) {
      const lowerHeader = cleanHeader.toLowerCase();
      
      // Direct key matches
      const directMatches: Record<string, string[]> = {
        name: ["name", "title", "product", "medicine", "drug", "item"],
        generic_name: ["generic", "molecule", "chemical"],
        manufacturer: ["manufacturer", "company", "vendor", "maker", "producer", "lab"],
        batch_number: ["batch", "lot", "serial", "ndc"],
        expiry_date: ["expiry", "expire", "expiration", "valid until", "use by"],
        quantity: ["quantity", "qty", "stock", "count", "units", "inventory"],
        unit_cost: ["cost", "buy price", "purchase price"],
        selling_price: ["selling", "price", "mrp", "retail", "sale"],
        phone_number: ["phone", "mobile", "contact", "cell"],
        prescription_number: ["rx", "prescription", "script"],
        doctor_name: ["doctor", "physician", "dr", "prescriber"],
        date: ["date", "issued", "created", "order date"]
      };
      
      for (const [fieldName, keywords] of Object.entries(directMatches)) {
        for (const keyword of keywords) {
          if (lowerHeader.includes(keyword)) {
            mappings[header] = fieldName;
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }
  });
  
  return mappings;
}

/**
 * Saves a mapping template to the database
 */
export async function saveMappingTemplate(template: MappingTemplate): Promise<boolean> {
  try {
    // Cast the template to match the expected database structure
    const dbTemplate = {
      name: template.name,
      source_system: template.source_system,
      data_type: template.data_type,
      mappings: template.mappings,
      user_id: template.user_id || (await supabase.auth.getUser()).data.user?.id
    };
    
    const { error } = await supabase
      .from('mapping_templates')
      .insert([dbTemplate]);
      
    if (error) {
      console.error('Failed to save mapping template:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error saving mapping template:', err);
    return false;
  }
}

/**
 * Gets mapping templates for a specific data type
 */
export async function getMappingTemplates(dataType: 'Inventory' | 'Patients' | 'Prescriptions'): Promise<MappingTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('mapping_templates')
      .select('*')
      .eq('data_type', dataType)
      .order('name');
      
    if (error) {
      console.error('Failed to fetch mapping templates:', error);
      return [];
    }
    
    // Properly cast the data to ensure type compatibility
    return (data || []).map(item => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      source_system: item.source_system,
      data_type: item.data_type as 'Inventory' | 'Patients' | 'Prescriptions',
      mappings: item.mappings as Record<string, string>,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (err) {
    console.error('Error fetching mapping templates:', err);
    return [];
  }
}

/**
 * Deletes a mapping template
 */
export async function deleteMappingTemplate(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('mapping_templates')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Failed to delete mapping template:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error deleting mapping template:', err);
    return false;
  }
}

/**
 * Preview data transformation using a mapping template
 */
export function previewMappedData(data: any[], mappings: Record<string, string>): PreviewItem[] {
  return data.map(item => {
    const mappedItem: Record<string, any> = {};
    
    Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
      if (item[sourceKey] !== undefined) {
        mappedItem[targetKey] = item[sourceKey];
      }
    });
    
    return mappedItem as PreviewItem;
  });
}
