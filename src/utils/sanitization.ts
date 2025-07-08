/**
 * Enhanced input sanitization utilities for Priority 2 Security Implementation
 * Provides comprehensive sanitization for all user inputs
 */

import { sanitizeInput } from './securityUtils';

// Type definitions for sanitized inputs
export interface SanitizedPatientInput {
  name: string;
  phone_number: string;
  email?: string;
  address?: string;
  age?: number;
  gender?: string;
  medical_history?: string;
  allergies?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

export interface SanitizedMedicineInput {
  name: string;
  generic_name?: string;
  manufacturer?: string;
  batch_number?: string;
  description?: string;
  dosage?: string;
  side_effects?: string;
}

export interface SanitizedPrescriptionInput {
  prescription_number: string;
  doctor_name: string;
  patient_name: string;
  medicines: string;
  dosage_instructions?: string;
  notes?: string;
}

/**
 * Sanitizes patient input data
 */
export const sanitizePatientInput = (input: any): SanitizedPatientInput => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid patient input data');
  }

  // Validate required fields
  if (!input.name || typeof input.name !== 'string') {
    throw new Error('Patient name is required and must be a string');
  }

  if (!input.phone_number || typeof input.phone_number !== 'string') {
    throw new Error('Patient phone number is required and must be a string');
  }

  return {
    name: sanitizeInput(input.name?.toString().trim().slice(0, 100) || ''),
    phone_number: sanitizePhoneNumber(input.phone_number?.toString() || ''),
    email: input.email ? sanitizeEmail(input.email.toString()) : undefined,
    address: input.address ? sanitizeInput(input.address.toString().trim().slice(0, 500)) : undefined,
    age: input.age ? sanitizeAge(input.age) : undefined,
    gender: input.gender ? sanitizeGender(input.gender.toString()) : undefined,
    medical_history: input.medical_history ? sanitizeInput(input.medical_history.toString().trim().slice(0, 1000)) : undefined,
    allergies: input.allergies ? sanitizeInput(input.allergies.toString().trim().slice(0, 500)) : undefined,
    emergency_contact: input.emergency_contact ? sanitizeInput(input.emergency_contact.toString().trim().slice(0, 100)) : undefined,
    emergency_phone: input.emergency_phone ? sanitizePhoneNumber(input.emergency_phone.toString()) : undefined
  };
};

/**
 * Sanitizes medicine/inventory input data
 */
export const sanitizeMedicineInput = (input: any): SanitizedMedicineInput => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid medicine input data');
  }

  if (!input.name || typeof input.name !== 'string') {
    throw new Error('Medicine name is required and must be a string');
  }

  return {
    name: sanitizeInput(input.name.toString().trim().slice(0, 200)),
    generic_name: input.generic_name ? sanitizeInput(input.generic_name.toString().trim().slice(0, 200)) : undefined,
    manufacturer: input.manufacturer ? sanitizeInput(input.manufacturer.toString().trim().slice(0, 100)) : undefined,
    batch_number: input.batch_number ? sanitizeBatchNumber(input.batch_number.toString()) : undefined,
    description: input.description ? sanitizeInput(input.description.toString().trim().slice(0, 1000)) : undefined,
    dosage: input.dosage ? sanitizeInput(input.dosage.toString().trim().slice(0, 100)) : undefined,
    side_effects: input.side_effects ? sanitizeInput(input.side_effects.toString().trim().slice(0, 1000)) : undefined
  };
};

/**
 * Sanitizes prescription input data
 */
export const sanitizePrescriptionInput = (input: any): SanitizedPrescriptionInput => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid prescription input data');
  }

  const requiredFields = ['prescription_number', 'doctor_name', 'patient_name', 'medicines'];
  for (const field of requiredFields) {
    if (!input[field] || typeof input[field] !== 'string') {
      throw new Error(`${field} is required and must be a string`);
    }
  }

  return {
    prescription_number: sanitizePrescriptionNumber(input.prescription_number.toString()),
    doctor_name: sanitizeInput(input.doctor_name.toString().trim().slice(0, 100)),
    patient_name: sanitizeInput(input.patient_name.toString().trim().slice(0, 100)),
    medicines: sanitizeInput(input.medicines.toString().trim().slice(0, 2000)),
    dosage_instructions: input.dosage_instructions ? sanitizeInput(input.dosage_instructions.toString().trim().slice(0, 1000)) : undefined,
    notes: input.notes ? sanitizeInput(input.notes.toString().trim().slice(0, 1000)) : undefined
  };
};

/**
 * Sanitizes phone number input
 */
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Validate Indian phone number format (10 digits)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return cleaned;
  }
  
  // Handle numbers with country code (+91)
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]/.test(cleaned)) {
    return cleaned.slice(2); // Remove country code
  }
  
  throw new Error('Invalid phone number format. Must be a valid 10-digit Indian mobile number.');
};

/**
 * Sanitizes email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const cleaned = email.toLowerCase().trim().slice(0, 254); // RFC 5321 limit
  
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  
  return sanitizeInput(cleaned);
};

/**
 * Sanitizes age input
 */
export const sanitizeAge = (age: any): number => {
  const numAge = parseInt(age?.toString() || '0', 10);
  
  if (isNaN(numAge) || numAge < 0 || numAge > 150) {
    throw new Error('Invalid age. Must be between 0 and 150.');
  }
  
  return numAge;
};

/**
 * Sanitizes gender input
 */
export const sanitizeGender = (gender: string): string => {
  if (!gender) return '';
  
  const validGenders = ['male', 'female', 'other', 'prefer not to say'];
  const cleaned = gender.toLowerCase().trim();
  
  if (!validGenders.includes(cleaned)) {
    throw new Error('Invalid gender value');
  }
  
  return cleaned;
};

/**
 * Sanitizes batch number input
 */
export const sanitizeBatchNumber = (batchNumber: string): string => {
  if (!batchNumber) return '';
  
  // Allow alphanumeric characters, hyphens, and underscores only
  const cleaned = batchNumber.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 50);
  
  if (cleaned.length < 3) {
    throw new Error('Batch number must be at least 3 characters long');
  }
  
  return cleaned;
};

/**
 * Sanitizes prescription number input
 */
export const sanitizePrescriptionNumber = (prescriptionNumber: string): string => {
  if (!prescriptionNumber) {
    throw new Error('Prescription number is required');
  }
  
  // Allow alphanumeric characters, hyphens, slashes, and underscores only
  const cleaned = prescriptionNumber.replace(/[^a-zA-Z0-9\-/_]/g, '').slice(0, 50);
  
  if (cleaned.length < 3) {
    throw new Error('Prescription number must be at least 3 characters long');
  }
  
  return cleaned;
};

/**
 * Sanitizes numeric input (for prices, quantities, etc.)
 */
export const sanitizeNumericInput = (value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  const num = parseFloat(value?.toString() || '0');
  
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Invalid numeric value. Must be between ${min} and ${max}.`);
  }
  
  return Math.round(num * 100) / 100; // Round to 2 decimal places
};

/**
 * Sanitizes date input
 */
export const sanitizeDateInput = (date: any): string => {
  if (!date) {
    throw new Error('Date is required');
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date format');
  }
  
  // Check if date is not too far in the past or future
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
  const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years from now
  
  if (dateObj < minDate || dateObj > maxDate) {
    throw new Error('Date must be within reasonable range');
  }
  
  return dateObj.toISOString();
};

/**
 * Comprehensive input validation and sanitization
 */
export const validateAndSanitize = {
  patient: sanitizePatientInput,
  medicine: sanitizeMedicineInput,
  prescription: sanitizePrescriptionInput,
  phone: sanitizePhoneNumber,
  email: sanitizeEmail,
  age: sanitizeAge,
  gender: sanitizeGender,
  batchNumber: sanitizeBatchNumber,
  prescriptionNumber: sanitizePrescriptionNumber,
  numeric: sanitizeNumericInput,
  date: sanitizeDateInput
};

/**
 * Security logging function for sanitization events
 */
export const logSanitizationEvent = (eventType: string, input: any, error?: Error): void => {
  const event = {
    timestamp: new Date().toISOString(),
    type: 'SANITIZATION_EVENT',
    eventType,
    inputType: typeof input,
    inputLength: input?.toString?.()?.length || 0,
    error: error?.message,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };
  
  // Log to console in development
  if (import.meta.env.DEV) {
    console.warn('Sanitization Event:', event);
  }
  
  // In production, this could be sent to a monitoring service
  // Example: sendToMonitoringService(event);
};