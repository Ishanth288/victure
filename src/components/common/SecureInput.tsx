/**
 * Secure Input Component with Enhanced Validation and Sanitization
 * Priority 2 Security Implementation
 */

import React, { useState, useEffect } from 'react';
import { sanitizeInput, validateEmail, checkPasswordStrength } from '../../utils/securityUtils';
import {
  sanitizePatientInput,
  sanitizeMedicineInput,
  sanitizePrescriptionInput,
  sanitizePhoneNumber,
  sanitizeAge,
  sanitizeNumericValue
} from '../../utils/sanitization';
import { logSecurityEvent } from '../../utils/securityLogger';

interface SecureInputProps {
  type: 'text' | 'email' | 'password' | 'phone' | 'number' | 'patient' | 'medicine' | 'prescription';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  'data-testid'?: string;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  showValidation?: boolean;
  label?: string;
  id?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const SecureInput: React.FC<SecureInputProps> = ({
  type,
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  disabled = false,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  'data-testid': dataTestId,
  onValidationChange,
  showValidation = true,
  label,
  id
}) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenTouched, setHasBeenTouched] = useState(false);

  // Sanitize input based on type
  const sanitizeValue = (inputValue: string): string => {
    try {
      switch (type) {
        case 'patient':
          return sanitizePatientInput({ name: inputValue }).name;
        case 'medicine':
          return sanitizeMedicineInput({ name: inputValue }).name;
        case 'prescription':
          return sanitizePrescriptionInput({ notes: inputValue }).notes;
        case 'phone':
          return sanitizePhoneNumber(inputValue);
        case 'number':
          return sanitizeNumericValue(inputValue).toString();
        case 'email':
        case 'password':
        case 'text':
        default:
          return sanitizeInput(inputValue);
      }
    } catch (error) {
      console.error('Sanitization error:', error);
      logSecurityEvent('INPUT_SANITIZATION_ERROR', {
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        inputLength: inputValue.length
      });
      return sanitizeInput(inputValue); // Fallback to basic sanitization
    }
  };

  // Validate input based on type and rules
  const validateInput = (inputValue: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (required && !inputValue.trim()) {
      errors.push('This field is required');
    }

    // Length validations
    if (minLength && inputValue.length < minLength) {
      errors.push(`Minimum length is ${minLength} characters`);
    }

    if (maxLength && inputValue.length > maxLength) {
      errors.push(`Maximum length is ${maxLength} characters`);
    }

    // Pattern validation
    if (pattern && inputValue && !new RegExp(pattern).test(inputValue)) {
      errors.push('Invalid format');
    }

    // Type-specific validations
    switch (type) {
      case 'email':
        if (inputValue && !validateEmail(inputValue)) {
          errors.push('Please enter a valid email address');
        }
        break;

      case 'password':
        if (inputValue) {
          const strength = checkPasswordStrength(inputValue);
          if (strength.score < 3) {
            errors.push('Password is too weak');
            warnings.push(...strength.feedback);
          } else if (strength.score < 4) {
            warnings.push('Consider using a stronger password');
          }
        }
        break;

      case 'phone':
        if (inputValue && !/^[\d\s\-\+\(\)]+$/.test(inputValue)) {
          errors.push('Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses');
        }
        if (inputValue && inputValue.replace(/\D/g, '').length < 10) {
          errors.push('Phone number must be at least 10 digits');
        }
        break;

      case 'number':
        if (inputValue && !/^\d*\.?\d*$/.test(inputValue)) {
          errors.push('Please enter a valid number');
        }
        break;

      case 'patient':
        if (inputValue && inputValue.length < 2) {
          errors.push('Patient name must be at least 2 characters');
        }
        if (inputValue && !/^[a-zA-Z\s\-\.]+$/.test(inputValue)) {
          errors.push('Patient name can only contain letters, spaces, hyphens, and periods');
        }
        break;

      case 'medicine':
        if (inputValue && inputValue.length < 2) {
          errors.push('Medicine name must be at least 2 characters');
        }
        break;

      case 'prescription':
        if (inputValue && inputValue.length > 500) {
          warnings.push('Prescription notes are quite long');
        }
        break;
    }

    // Check for potential security issues
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /\beval\s*\(/i,
      /\balert\s*\(/i
    ];

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(inputValue));
    if (hasSuspiciousContent) {
      errors.push('Input contains potentially unsafe content');
      logSecurityEvent('SUSPICIOUS_INPUT_DETECTED', {
        type,
        inputLength: inputValue.length,
        patterns: suspiciousPatterns.filter(pattern => pattern.test(inputValue)).map(p => p.toString())
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Handle input change with sanitization and validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeValue(rawValue);
    
    // If sanitization changed the value significantly, log it
    if (sanitizedValue !== rawValue && Math.abs(sanitizedValue.length - rawValue.length) > 2) {
      logSecurityEvent('INPUT_SANITIZED', {
        type,
        originalLength: rawValue.length,
        sanitizedLength: sanitizedValue.length,
        significant: true
      });
    }
    
    onChange(sanitizedValue);
  };

  // Validate on value change
  useEffect(() => {
    const validationResult = validateInput(value);
    setValidation(validationResult);
    
    if (onValidationChange) {
      onValidationChange(validationResult.isValid, validationResult.errors);
    }
  }, [value, required, minLength, maxLength, pattern, type]);

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenTouched(true);
  };

  // Determine input type for HTML input element
  const getHtmlInputType = (): string => {
    switch (type) {
      case 'email': return 'email';
      case 'password': return 'password';
      case 'phone': return 'tel';
      case 'number': return 'number';
      default: return 'text';
    }
  };

  // Build CSS classes
  const inputClasses = [
    'w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    validation.isValid || !hasBeenTouched
      ? 'border-gray-300'
      : 'border-red-300 bg-red-50',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white',
    className
  ].filter(Boolean).join(' ');

  const shouldShowValidation = showValidation && hasBeenTouched && !isFocused;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={id}
          type={getHtmlInputType()}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          data-testid={dataTestId}
          aria-invalid={!validation.isValid}
          aria-describedby={shouldShowValidation ? `${id}-validation` : undefined}
        />
        
        {/* Validation icon */}
        {shouldShowValidation && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {validation.isValid ? (
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>
      
      {/* Validation messages */}
      {shouldShowValidation && (
        <div id={`${id}-validation`} className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={`error-${index}`} className="text-sm text-red-600 flex items-center">
              <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
          {validation.warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="text-sm text-yellow-600 flex items-center">
              <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {warning}
            </p>
          ))}
        </div>
      )}
      
      {/* Password strength indicator */}
      {type === 'password' && value && shouldShowValidation && (
        <div className="space-y-1">
          <div className="text-xs text-gray-600">Password strength:</div>
          <div className="flex space-x-1">
            {[1, 2, 3, 4].map((level) => {
              const strength = checkPasswordStrength(value);
              const isActive = strength.score >= level;
              const colorClass = 
                strength.score >= 4 ? 'bg-green-500' :
                strength.score >= 3 ? 'bg-yellow-500' :
                strength.score >= 2 ? 'bg-orange-500' :
                'bg-red-500';
              
              return (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded ${
                    isActive ? colorClass : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecureInput;