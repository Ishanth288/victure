
import { stableToast } from '@/components/ui/stable-toast';

/**
 * Display standardized error messages throughout the application
 * @param error The error object or message
 * @param context Additional context about where the error occurred
 */
export const displayErrorMessage = (error: any, context?: string) => {
  const errorMessage = error?.message || error?.error?.message || String(error);
  const contextPrefix = context ? `${context}: ` : '';
  
  stableToast({
    title: "Error",
    description: `${contextPrefix}${errorMessage}`,
    variant: "error",
  });
  
  console.error(`Error in ${context || 'application'}:`, error);
};

/**
 * Check if an object is an error
 * @param obj The object to check
 */
export const isErrorObject = (obj: any): boolean => {
  return (
    obj instanceof Error || 
    (typeof obj === 'object' && 
     obj !== null && 
     ('message' in obj || 'error' in obj))
  );
};

/**
 * Safely extract error message from various error object formats
 * @param error The error object
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.details) return error.details;
  if (error?.statusText) return error.statusText;
  
  return 'An unknown error occurred';
};

/**
 * Log an error to the console and potentially to a monitoring service
 * @param error The error to log
 * @param info Additional information about the error
 */
export const logError = (error: any, info?: string): void => {
  console.error(`Application error ${info ? `in ${info}` : ''}:`, error);
  // This would be a good place to add Sentry or other error logging service
};
