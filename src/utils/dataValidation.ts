
import { PreviewItem } from "@/types/dataMigration";

/**
 * Validates inventory item data
 */
export function validateInventoryItem(item: PreviewItem): { 
  valid: boolean;
  warnings: Array<{ type: string; message: string }>;
} {
  const warnings: Array<{ type: string; message: string }> = [];

  // Check required fields
  if (!item.name) {
    warnings.push({ type: "missing", message: "Medicine name is required" });
  }

  // Check expiry date
  if (item.expiry_date) {
    const expiryDate = new Date(item.expiry_date);
    if (isNaN(expiryDate.getTime())) {
      warnings.push({ type: "invalid", message: "Invalid expiry date format" });
    } else if (expiryDate < new Date()) {
      warnings.push({ type: "expired", message: "Medicine is expired" });
    }
  } else {
    warnings.push({ type: "missing", message: "Expiry date is required" });
  }

  // Check price
  if (item.selling_price === undefined || item.selling_price === null) {
    warnings.push({ type: "missing", message: "Selling price is required" });
  } else if (isNaN(Number(item.selling_price)) || Number(item.selling_price) < 0) {
    warnings.push({ type: "price", message: "Invalid selling price" });
  }

  // Check quantity
  if (item.quantity === undefined || item.quantity === null) {
    warnings.push({ type: "missing", message: "Quantity is required" });
  } else if (isNaN(Number(item.quantity)) || Number(item.quantity) < 0) {
    warnings.push({ type: "invalid", message: "Invalid quantity" });
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Validates patient data
 */
export function validatePatientData(patient: PreviewItem): {
  valid: boolean;
  warnings: Array<{ type: string; message: string }>;
} {
  const warnings: Array<{ type: string; message: string }> = [];

  // Check required fields
  if (!patient.name) {
    warnings.push({ type: "missing", message: "Patient name is required" });
  }

  if (!patient.phone_number) {
    warnings.push({ type: "missing", message: "Phone number is required" });
  } else {
    const phoneString = String(patient.phone_number);
    if (!/^\d{10}$/.test(phoneString.replace(/\D/g, ''))) {
      warnings.push({ type: "invalid", message: "Invalid phone number format" });
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Validates prescription data
 */
export function validatePrescriptionData(prescription: PreviewItem): {
  valid: boolean;
  warnings: Array<{ type: string; message: string }>;
} {
  const warnings: Array<{ type: string; message: string }> = [];

  // Check required fields
  if (!prescription.prescription_number) {
    warnings.push({ type: "missing", message: "Prescription number is required" });
  }

  if (!prescription.doctor_name) {
    warnings.push({ type: "missing", message: "Doctor name is required" });
  }

  if (!prescription.date) {
    warnings.push({ type: "missing", message: "Prescription date is required" });
  } else {
    const prescDate = new Date(prescription.date);
    if (isNaN(prescDate.getTime())) {
      warnings.push({ type: "invalid", message: "Invalid prescription date format" });
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Checks if the data set has too many invalid items
 */
export function hasTooManyInvalidItems(items: PreviewItem[], threshold: number = 0.1): boolean {
  let invalidCount = 0;
  
  items.forEach(item => {
    if (item.hasWarning) {
      invalidCount++;
    }
  });
  
  return invalidCount / items.length > threshold;
}

/**
 * Attempts to fix common data issues automatically
 */
export function autoFixData(items: PreviewItem[]): PreviewItem[] {
  return items.map(item => {
    const fixed = { ...item };
    
    // Fix numeric values
    if (typeof fixed.selling_price === 'string') {
      const sellingPriceStr = String(fixed.selling_price);
      fixed.selling_price = parseFloat(sellingPriceStr.replace(/[^\d.-]/g, ''));
    }
    
    if (typeof fixed.unit_cost === 'string') {
      const unitCostStr = String(fixed.unit_cost);
      fixed.unit_cost = parseFloat(unitCostStr.replace(/[^\d.-]/g, ''));
    }
    
    if (typeof fixed.quantity === 'string') {
      const quantityStr = String(fixed.quantity);
      fixed.quantity = parseInt(quantityStr.replace(/[^\d]/g, '') || '0', 10);
    }
    
    // Standardize date formats (assuming Indian format DD/MM/YYYY)
    if (fixed.expiry_date && typeof fixed.expiry_date === 'string') {
      // Handle DD/MM/YYYY format
      const dateMatch = fixed.expiry_date.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
      if (dateMatch) {
        const [_, day, month, year] = dateMatch;
        fixed.expiry_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }
    
    return fixed;
  });
}
